import json
import os
import shutil
import subprocess
import tempfile
import threading
import time
import mimetypes
from datetime import datetime
from typing import Optional

from dateutil import parser as dateparser
from flask import Blueprint, jsonify, request
from pymongo import MongoClient
import requests
import boto3
  
main = Blueprint("main", __name__)

MONGODB_URI = os.getenv("MONGODB_URL", "mongodb://mongo:27017/kloudraksha")
MONGODB_DB = os.getenv("MONGODB_DB", "kloudraksha")
PROWLER_IMAGE = os.getenv("PROWLER_IMAGE", "toniblyx/prowler:latest")
S3_BUCKET = os.getenv("AWS_S3_BUCKET")
S3_PREFIX = os.getenv("AWS_S3_PREFIX", "prowler-reports")
SES_SENDER = os.getenv("SES_SENDER_EMAIL")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
RAW_REPORT_RETENTION_DAYS = int(os.getenv("RAW_REPORT_RETENTION_DAYS", "30"))
S3_UPLOAD_ATTEMPTS = int(os.getenv("S3_UPLOAD_ATTEMPTS", "3"))
S3_UPLOAD_BACKOFF_SECONDS = float(os.getenv("S3_UPLOAD_BACKOFF", "2"))
# Default formats: json-ocsf (for structured data), json-asff (AWS Security Finding Format), html (for reports)
PROWLER_OUTPUT_FORMATS = os.getenv("PROWLER_FORMATS", "json-ocsf,json-asff,html")
OUTPUT_POLL_ATTEMPTS = int(os.getenv("PROWLER_OUTPUT_POLL_ATTEMPTS", "5"))
OUTPUT_POLL_INTERVAL = float(os.getenv("PROWLER_OUTPUT_POLL_INTERVAL", "2"))
PROWLER_VOLUME_PREFIX = os.getenv("PROWLER_VOLUME_PREFIX", "kloudraksha_prowler")

# Use /tmp/audit by default (mounted docker volume)
TEMP_BASE_DIR = os.getenv("AUDIT_CONTAINER_BASE", "/tmp/audit")
os.makedirs(TEMP_BASE_DIR, exist_ok=True)

# Local fallback directory for reports if S3 upload fails
LOCAL_REPORTS_DIR = os.getenv("LOCAL_REPORTS_DIR", "/app/prowler-reports")
os.makedirs(LOCAL_REPORTS_DIR, exist_ok=True)

mongo_client = MongoClient(MONGODB_URI)
db = mongo_client[MONGODB_DB]
metadata_collection = db["scanrequests"]
results_collection = db["results"]

aws_session = boto3.session.Session(
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=AWS_REGION,
)

s3_client = aws_session.client("s3") if S3_BUCKET else None
ses_client = aws_session.client("ses") if SES_SENDER else None


def _run_command(command: list[str], timeout: int = 30) -> subprocess.CompletedProcess:
    """Run a command with timeout and error handling."""
    try:
        process = subprocess.run(
            command,
            capture_output=True,
            text=True,
            env=os.environ.copy(),
            timeout=timeout,
        )
        if process.returncode not in (0,):
            raise subprocess.CalledProcessError(
                process.returncode, command, output=process.stdout, stderr=process.stderr
            )
        return process
    except subprocess.TimeoutExpired as e:
        print(f"[command] Command timed out after {timeout}s: {' '.join(command[:3])}")
        raise


def _check_docker_available():
    """Check if Docker is available and accessible."""
    try:
        result = subprocess.run(
            ["docker", "version"],
            capture_output=True,
            text=True,
            timeout=10,
        )
        if result.returncode != 0:
            raise RuntimeError(f"Docker is not available: {result.stderr}")
        print("[audit] Docker is available and accessible")
        return True
    except FileNotFoundError:
        raise RuntimeError("Docker command not found. Please ensure Docker is installed and accessible.")
    except Exception as exc:
        raise RuntimeError(f"Failed to check Docker availability: {exc}")


def _check_image_exists(image_name: str) -> bool:
    """Check if Docker image exists locally."""
    try:
        result = subprocess.run(
            ["docker", "images", "-q", image_name],
            capture_output=True,
            text=True,
            timeout=10,
        )
        return bool(result.stdout.strip())
    except Exception as exc:
        print(f"[audit] Failed to check if image exists: {exc}")
        return False


def _cleanup_docker_layers():
    """Clean up corrupted Docker layers that might prevent image pulls."""
    try:
        print("[audit] Attempting to clean up Docker system...")
        # Prune build cache and dangling images
        subprocess.run(
            ["docker", "system", "prune", "-f"],
            capture_output=True,
            text=True,
            timeout=60,
        )
        print("[audit] Docker cleanup completed")
    except Exception as exc:
        print(f"[audit] Warning: Docker cleanup failed (non-critical): {exc}")


def _sanitize_volume_name(value: str) -> str:
    sanitized = [c.lower() if c.isalnum() else "-" for c in value]
    name = "".join(sanitized).strip("-") or "prowler"
    return name[:200]


def _create_docker_volume(name: str):
    try:
        subprocess.run(["docker", "volume", "create", name], check=True, capture_output=True)
        print(f"[audit] Created docker volume {name}")
    except subprocess.CalledProcessError as exc:
        raise RuntimeError(f"Failed to create docker volume {name}: {exc.stderr or exc.stdout}")


def _remove_docker_volume(name: str):
    try:
        subprocess.run(["docker", "volume", "rm", "-f", name], check=False, capture_output=True)
        print(f"[audit] Removed docker volume {name}")
    except Exception as exc:
        print(f"[audit] Warning: failed to remove volume {name}: {exc}")


def _copy_volume_to_directory(volume_name: str, destination: str):
    shutil.rmtree(destination, ignore_errors=True)
    os.makedirs(destination, exist_ok=True)

    tar_cmd = [
        "docker",
        "run",
        "--rm",
        "--mount",
        f"source={volume_name},target=/data,readonly",
        "busybox",
        "sh",
        "-c",
        "cd /data && tar -cf - .",
    ]

    with subprocess.Popen(tar_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE) as tar_proc:
        extract = subprocess.run(["tar", "-xf", "-", "-C", destination], stdin=tar_proc.stdout)
        _, stderr = tar_proc.communicate()
        if tar_proc.returncode not in (0,):
            raise RuntimeError(
                f"Failed to copy files from volume {volume_name}: {stderr.decode('utf-8', errors='ignore')}"
            )
        if extract.returncode != 0:
            raise RuntimeError("Failed to extract prowler artifacts from volume")


def _pull_prowler_image():
    """Pull the Prowler Docker image if it doesn't exist locally."""
    # First check if image already exists (quiet check)
    if _check_image_exists(PROWLER_IMAGE):
        # Don't log if image exists - reduces noise
        return True
    
    max_retries = 2
    for attempt in range(1, max_retries + 1):
        try:
            # On retry, clean up Docker layers first
            if attempt > 1:
                print(f"[audit] Retry attempt {attempt}/{max_retries}: Cleaning up Docker layers...")
                _cleanup_docker_layers()
                time.sleep(5)  # Wait a bit after cleanup
            
            # Only show pull message on first attempt to reduce noise
            if attempt == 1:
                print(f"[audit] Pulling Prowler image: {PROWLER_IMAGE} (this may take several minutes)...")
            
            # Try pulling with DOCKER_BUILDKIT=0 to avoid buildkit issues
            env = os.environ.copy()
            env.pop("DOCKER_BUILDKIT", None)  # Remove buildkit if set
            
            # Use subprocess.run directly with longer timeout
            # Suppress output during pull to reduce noise (only show on errors)
            process = subprocess.run(
                ["docker", "pull", PROWLER_IMAGE],
                capture_output=True,
                text=True,
                timeout=900,  # 15 minutes timeout
                env=env,
            )
            
            if process.returncode == 0:
                if attempt == 1:
                    print(f"[audit] Successfully pulled {PROWLER_IMAGE}")
                return True
            else:
                error_msg = process.stderr[:500] if process.stderr else process.stdout[:500]
                # Only log errors, not warnings
                if attempt == max_retries:
                    print(f"[audit] Docker pull failed (exit {process.returncode})")
                    print(f"[audit] Error: {error_msg}")
                
                # Check if image exists despite the error
                if _check_image_exists(PROWLER_IMAGE):
                    print(f"[audit] Image exists locally despite pull error, proceeding...")
                    return True
                
                # If it's a layer corruption error and we have retries left, retry
                if "commit failed" in error_msg or "unexpected commit digest" in error_msg:
                    if attempt < max_retries:
                        print(f"[audit] Layer corruption detected, will retry after cleanup...")
                        continue
                    else:
                        raise RuntimeError(
                            f"Failed to pull Prowler image after {max_retries} attempts due to layer corruption. "
                            f"Try running 'docker system prune -a' on the host, then retry."
                        )
                else:
                    raise RuntimeError(f"Failed to pull Prowler image: {error_msg[:300]}")
                    
        except subprocess.TimeoutExpired:
            print(f"[audit] Warning: Image pull timed out after 15 minutes (attempt {attempt}/{max_retries})...")
            # Check again in case it was partially pulled
            if _check_image_exists(PROWLER_IMAGE):
                print(f"[audit] Image exists locally despite timeout, proceeding...")
                return True
            if attempt < max_retries:
                continue
            raise RuntimeError(f"Failed to pull Prowler image {PROWLER_IMAGE} (timeout after 15 minutes)")
        except RuntimeError:
            # Re-raise RuntimeError (our custom errors)
            raise
        except Exception as exc:
            print(f"[audit] Warning: Failed to pull image (attempt {attempt}/{max_retries}): {exc}")
            # Check if image exists despite the error
            if _check_image_exists(PROWLER_IMAGE):
                print(f"[audit] Image exists locally despite pull error, proceeding...")
                return True
            if attempt < max_retries:
                continue
            raise RuntimeError(f"Failed to pull Prowler image {PROWLER_IMAGE}: {exc}")
    
    # Should not reach here, but just in case
    raise RuntimeError(f"Failed to pull Prowler image {PROWLER_IMAGE} after {max_retries} attempts")


def send_email(subject: str, body: str, recipient: str):
    """Send email via AWS SES."""
    if not ses_client or not SES_SENDER:
        print("[SES] Email sending disabled (no SES client or sender configured)")
        return
    try:
        ses_client.send_email(
            Source=SES_SENDER,
            Destination={"ToAddresses": [recipient]},
            Message={
                "Subject": {"Data": subject, "Charset": "UTF-8"},
                "Body": {"Text": {"Data": body, "Charset": "UTF-8"}},
            },
        )
        print(f"[SES] Email sent successfully to {recipient}")
    except Exception as exc:
        print(f"[SES] Failed to send email: {exc}")


def save_to_local_fallback(local_path: str, audit_id: str) -> str:
    """Save file to local fallback directory and return the local path."""
    try:
        audit_dir = os.path.join(LOCAL_REPORTS_DIR, audit_id)
        os.makedirs(audit_dir, exist_ok=True)
        
        dest_path = os.path.join(audit_dir, os.path.basename(local_path))
        shutil.copy2(local_path, dest_path)
        print(f"[local] Saved file to local fallback: {dest_path}")
        return dest_path
    except Exception as exc:
        print(f"[local] Failed to save file to local fallback: {exc}")
        raise


def upload_to_s3(local_path: str, audit_id: str) -> tuple[str, str]:
    """Upload file to S3 and return bucket and key. Falls back to local storage if S3 fails."""
    if not S3_BUCKET:
        print(f"[S3] S3_BUCKET not configured, using local fallback")
        local_path = save_to_local_fallback(local_path, audit_id)
        return "local", local_path
    
    if not s3_client:
        print(f"[S3] S3 client not initialized, using local fallback")
        local_path = save_to_local_fallback(local_path, audit_id)
        return "local", local_path

    # Ensure bucket exists
    try:
        s3_client.head_bucket(Bucket=S3_BUCKET)
    except s3_client.exceptions.NoSuchBucket:
        try:
            s3_client.create_bucket(Bucket=S3_BUCKET)
            print(f"[S3] Created bucket {S3_BUCKET}")
        except Exception as e:
            print(f"[S3] Failed to create bucket {S3_BUCKET}: {e}")
            local_path = save_to_local_fallback(local_path, audit_id)
            return "local", local_path
    except Exception as e:
        print(f"[S3] Failed to check bucket {S3_BUCKET}: {e}")
        local_path = save_to_local_fallback(local_path, audit_id)
        return "local", local_path

    key = f"{S3_PREFIX}/{audit_id}/{os.path.basename(local_path)}"
    last_exc: Optional[Exception] = None
    attempts = max(1, S3_UPLOAD_ATTEMPTS)

    for attempt in range(1, attempts + 1):
        try:
            s3_client.upload_file(local_path, S3_BUCKET, key)
            print(f"[S3] Successfully uploaded to s3://{S3_BUCKET}/{key} (attempt {attempt})")

            # Always keep a local copy for easy access/diagnostics
            try:
                save_to_local_fallback(local_path, audit_id)
            except Exception as local_exc:
                print(f"[local] Warning: failed to archive local report copy: {local_exc}")

            return S3_BUCKET, key
        except Exception as exc:
            last_exc = exc
            print(f"[S3] Failed to upload file (attempt {attempt}): {exc}")
            if attempt < attempts:
                sleep_for = S3_UPLOAD_BACKOFF_SECONDS * attempt
                print(f"[S3] Retrying upload in {sleep_for:.1f}s...")
                time.sleep(sleep_for)

    # S3 upload failed, fallback to local storage
    print(f"[S3] All S3 upload attempts failed, falling back to local storage")
    try:
        local_path = save_to_local_fallback(local_path, audit_id)
        return "local", local_path
    except Exception as local_exc:
        raise RuntimeError(f"Failed to upload to S3 and local fallback also failed: {last_exc}, {local_exc}")


def transform_raw_finding_prowler(finding: dict) -> dict | None:
    """Transform Prowler OCSF finding to internal format."""
    try:
        return {
            "SchemaVersion": finding.get("metadata", {}).get("schema_version", ""),
            "Id": finding.get("finding_info", {}).get("uid", ""),
            "ProductArn": "",
            "RecordState": "ACTIVE",
            "ProductFields": {
                "ProviderName": finding.get("cloud", {}).get("provider", ""),
                "ProviderVersion": finding.get("metadata", {})
                .get("product", {})
                .get("version", ""),
                "ProwlerResourceName": finding.get("resources", [{}])[0].get("name", ""),
            },
            "GeneratorId": finding.get("finding_info", {}).get("generator_id", ""),
            "AwsAccountId": finding.get("cloud", {}).get("account", {}).get("uid", ""),
            "Types": finding.get("finding_info", {}).get("types", []),
            "FirstObservedAt": dateparser.parse(finding.get("time_dt"))
            if finding.get("time_dt")
            else datetime.utcnow(),
            "UpdatedAt": datetime.utcnow(),
            "CreatedAt": dateparser.parse(finding.get("time_dt"))
            if finding.get("time_dt")
            else datetime.utcnow(),
            "Severity": {
                "Label": finding.get("severity", "UNKNOWN").upper(),
            },
            "Title": finding.get("finding_info", {}).get("title", ""),
            "Description": finding.get("message", ""),
            "Resources": [
                {
                    "Type": r.get("type", ""),
                    "Id": r.get("uid", ""),
                    "Partition": r.get("cloud_partition", ""),
                    "Region": r.get("region", ""),
                }
                for r in finding.get("resources", [])
            ],
            "Compliance": {
                "Status": "FAILED"
                if finding.get("status_code", "").upper() == "FAIL"
                else "PASSED",
                "RelatedRequirements": list(
                    finding.get("unmapped", {}).get("compliance", {}).keys()
                ),
                "AssociatedStandards": [],
            },
            "Remediation": {
                "Recommendation": {
                    "Text": finding.get("remediation", {}).get("desc", ""),
                    "Url": (finding.get("remediation", {}).get("references") or [""])[0],
                }
            },
        }
    except Exception as exc:
        print(f"[transform] Failed to map finding: {exc}")
        return None


def calculate_metadata(findings: list[dict]) -> dict:
    """Calculate summary metadata from findings."""
    total = len(findings)
    failed = sum(1 for f in findings if f.get("Compliance", {}).get("Status") == "FAILED")
    passed = total - failed
    critical = sum(1 for f in findings if f.get("Severity", {}).get("Label") == "CRITICAL")
    high = sum(1 for f in findings if f.get("Severity", {}).get("Label") == "HIGH")
    medium = sum(1 for f in findings if f.get("Severity", {}).get("Label") == "MEDIUM")
    low = sum(1 for f in findings if f.get("Severity", {}).get("Label") == "LOW")

    return {
        "aws_account_id": findings[0].get("AwsAccountId") if findings else "",
        "total_findings": total,
        "failed_findings": failed,
        "passed_findings": passed,
        "critical_findings": critical,
        "high_findings": high,
        "medium_findings": medium,
        "low_findings": low,
    }


def cleanup_container(container_name: str):
    """Clean up Docker container safely."""
    try:
        subprocess.run(
            ["docker", "rm", "-f", container_name],
            check=False,
            capture_output=True,
            text=True,
            timeout=30
        )
    except Exception as exc:
        print(f"[cleanup] Failed to remove container {container_name}: {exc}")

def run_audit_in_thread(payload: dict):
    """Run Prowler audit in background thread."""
    audit_id = payload["audit_id"]
    user_id = payload["user_id"]
    provider = payload.get("provider")
    office_email = payload.get("office_email")

    container_name = f"prowler_{audit_id[:8]}_{int(time.time())}"
    output_volume = _sanitize_volume_name(
        f"{PROWLER_VOLUME_PREFIX}_{audit_id[:8]}_{int(time.time())}"
    )
    work_dir = tempfile.mkdtemp(prefix=f"prowler-{audit_id}-", dir=TEMP_BASE_DIR)
    output_dir = os.path.join(work_dir, "output")
    os.makedirs(output_dir, exist_ok=True)
    
    # Ensure absolute path for cross-platform compatibility (Mac/Ubuntu)
    output_dir = os.path.abspath(output_dir)
    work_dir = os.path.abspath(work_dir)

    print(f"[audit] Created work directory: {work_dir}")
    print(f"[audit] Output directory: {output_dir}")

    if not os.path.isdir(output_dir):
        raise RuntimeError(f"Output directory not accessible: {output_dir}")
    
    # Ensure directory permissions allow Prowler container to write
    os.chmod(output_dir, 0o777)

    metadata_collection.update_one(
        {"audit_id": audit_id, "user_id": user_id},
        {
            "$set": {
                "status": "pending",
                "user_id": user_id,
                "audit_id": audit_id,
                "user_info": {
                    "name": payload.get("name"),
                    "email": payload.get("email"),
                    "purpose": payload.get("purpose"),
                    "officeEmail": office_email,
                    "provider": provider,
                },
                "provider": provider,
                "started_at": datetime.utcnow(),
                "upload_errors": [],
            }
        },
        upsert=True,
    )

    if provider != "aws":
        error_msg = f"Provider {provider} not supported"
        print(f"[audit] {error_msg}")
        metadata_collection.update_one(
            {"audit_id": audit_id, "user_id": user_id},
            {"$set": {"status": "failed", "error": error_msg}},
        )
        shutil.rmtree(work_dir, ignore_errors=True)
        return

    if not payload.get("aws_access_key") or not payload.get("aws_secret_key"):
        error_msg = "Missing AWS credentials"
        print(f"[audit] {error_msg}")
        metadata_collection.update_one(
            {"audit_id": audit_id, "user_id": user_id},
            {"$set": {"status": "failed", "error": error_msg}},
        )
        shutil.rmtree(work_dir, ignore_errors=True)
        return

    upload_errors: list[dict] = []

    _create_docker_volume(output_volume)

    def note_upload_error(file_path: str, exc: Exception):
        message = str(exc)
        entry = {
            "file": os.path.basename(file_path),
            "message": message,
            "timestamp": datetime.utcnow(),
        }
        upload_errors.append(entry)
        print(f"[audit] Failed to upload {file_path}: {message}")

    try:
        metadata_collection.update_one(
            {"audit_id": audit_id, "user_id": user_id},
            {"$set": {"status": "reviewing"}},
        )

        cleanup_container(container_name)
        _check_docker_available()
        
        # Ensure Prowler image is available before proceeding
        try:
            _pull_prowler_image()
        except RuntimeError as img_err:
            error_msg = f"Prowler image not available: {img_err}"
            print(f"[audit] {error_msg}")
            metadata_collection.update_one(
                {"audit_id": audit_id, "user_id": user_id},
                {"$set": {"status": "failed", "error": error_msg, "failed_at": datetime.utcnow()}},
            )
            shutil.rmtree(work_dir, ignore_errors=True)
            return

        # Verify image exists before running container
        if not _check_image_exists(PROWLER_IMAGE):
            error_msg = f"Prowler image {PROWLER_IMAGE} is not available locally and could not be pulled"
            print(f"[audit] {error_msg}")
            raise RuntimeError(error_msg)
        
        # Parse output formats - Prowler expects multiple format arguments
        # Valid formats: csv, json-asff, json-ocsf, html
        # Split formats first, then process each one individually to avoid replacing "json" inside "json-asff"
        raw_formats = [fmt.strip() for fmt in PROWLER_OUTPUT_FORMATS.split(",") if fmt.strip()]
        output_formats_list = []
        for fmt in raw_formats:
            # Only replace standalone "json", not when it's part of "json-asff" or "json-ocsf"
            if fmt == "json":
                output_formats_list.append("json-asff")
            elif fmt in {"csv", "json-asff", "json-ocsf", "html"}:
                output_formats_list.append(fmt)
            else:
                # Unknown format, skip it or log warning
                print(f"[audit] Warning: Unknown format '{fmt}', skipping")
        
        # Validate formats
        valid_formats = {"csv", "json-asff", "json-ocsf", "html"}
        invalid_formats = [f for f in output_formats_list if f not in valid_formats]
        if invalid_formats:
            raise RuntimeError(f"Invalid output formats: {invalid_formats}. Valid formats are: {valid_formats}")
        
        if not output_formats_list:
            raise RuntimeError("No valid output formats specified")
        
        # Build Prowler command with proper format arguments
        prowler_cmd = [
            "docker",
            "run",
            "--rm",
            "--user", "0:0",  # run as root so we can write to the mounted docker volume
            "--name", container_name,
            "--mount", f"type=volume,source={output_volume},target=/tmp/output",
            "-e", f"AWS_ACCESS_KEY_ID={payload.get('aws_access_key').strip()}",
            "-e", f"AWS_SECRET_ACCESS_KEY={payload.get('aws_secret_key').strip()}",
            "-e", f"AWS_DEFAULT_REGION={AWS_REGION}",
            PROWLER_IMAGE,
            "aws",
        ]
        # Add the formats using the syntax expected by prowler v3 (single flag + multiple values)
        prowler_cmd.append("--output-formats")
        prowler_cmd.extend(output_formats_list)
        # Add remaining arguments
        prowler_cmd.extend([
            "--output-directory", "/tmp/output",
            "--output-filename", audit_id,
            "--no-banner",
            "--no-color",
        ])

        print(f"[audit] Running Prowler container: {container_name}")

        process = subprocess.run(
            prowler_cmd,
            capture_output=True,
            text=True,
            env=os.environ.copy(),
            timeout=1800,
        )

        # Only log exit code and errors if not successful (reduce noise)
        if process.returncode not in (0, 3):
            print(f"[audit] Prowler exit code: {process.returncode}")

        # Exit code 125 typically means Docker image not found
        if process.returncode == 125:
            error_detail = process.stderr[:500] if process.stderr else "Unknown error"
            if "Unable to find image" in error_detail or "pull access denied" in error_detail:
                raise RuntimeError(
                    f"Prowler image {PROWLER_IMAGE} not found. Please ensure the image is available. "
                    f"Error: {error_detail[:300]}"
                )
        
        # Exit code 2 is typically a command usage error - suppress verbose usage output
        if process.returncode == 2:
            error_detail = process.stderr[:1000] if process.stderr else process.stdout[:1000]
            # Suppress verbose usage messages - show concise error only
            print(f"[audit] Prowler command syntax error (exit 2)")
            # Extract concise error, skip verbose usage output
            if "usage:" in error_detail.lower():
                # Find first non-usage line as the actual error
                error_lines = [line.strip() for line in error_detail.split('\n') 
                              if line.strip() and not line.strip().startswith('usage:') 
                              and not '[-h]' in line and not '--version' in line]
                concise_error = error_lines[0][:150] if error_lines else "Invalid command arguments"
                raise RuntimeError(f"Prowler command error: {concise_error}")
            else:
                # Not a usage error, show first line
                first_line = error_detail.split('\n')[0][:200] if error_detail else "Unknown error"
                raise RuntimeError(f"Prowler command error: {first_line}")
        
        if process.returncode not in (0, 3):
            error_detail = process.stderr[:500] if process.stderr else process.stdout[:500]
            raise RuntimeError(
                f"Prowler failed (exit {process.returncode}): {error_detail[:300]}"
            )

        try:
            _copy_volume_to_directory(output_volume, output_dir)
        except RuntimeError as copy_err:
            raise RuntimeError(f"Failed to retrieve Prowler artifacts: {copy_err}")

        output_files = [
            os.path.join(output_dir, name)
            for name in os.listdir(output_dir)
            if os.path.isfile(os.path.join(output_dir, name))
        ]
        if not output_files:
            raise FileNotFoundError("Prowler did not generate any output files")

        json_candidates = [path for path in output_files if path.endswith(".json")]
        if not json_candidates:
            raise FileNotFoundError("Prowler did not generate any JSON output")

        preferred_json = next(
            (path for path in json_candidates if "ocsf" in os.path.basename(path).lower()),
            None,
        )
        json_path = preferred_json or max(json_candidates, key=os.path.getmtime)

        print(f"[audit] Found JSON output: {json_path} ({os.path.getsize(json_path)} bytes)")

        with open(json_path, "r", encoding="utf-8") as fh:
            raw_json = json.load(fh)

        if isinstance(raw_json, list):
            raw_findings = raw_json
        elif isinstance(raw_json, dict):
            raw_findings = (
                raw_json.get("findings")
                or raw_json.get("checks")
                or raw_json.get("results")
                or []
            )
        else:
            raw_findings = []

        print(f"[audit] Processing {len(raw_findings)} raw findings")

        findings = [f for f in (transform_raw_finding_prowler(f) for f in raw_findings) if f]
        metadata = calculate_metadata(findings)

        uploaded_files = []
        for file_path in output_files:
            try:
                bucket, key = upload_to_s3(file_path, audit_id)
                # Determine if file is in S3 or local storage
                is_local = bucket == "local"
                file_info = {
                    "bucket": bucket if not is_local else None,
                    "key": key,
                    "region": AWS_REGION if not is_local else None,
                    "filename": os.path.basename(file_path),
                    "mime_type": mimetypes.guess_type(file_path)[0] or "application/octet-stream",
                    "size": os.path.getsize(file_path),
                    "type": describe_report_file(file_path),
                    "storage": "local" if is_local else "s3",
                    "local_path": key if is_local else None,
                }
                uploaded_files.append(file_info)
                if is_local:
                    print(f"[audit] Saved {os.path.basename(file_path)} to local fallback: {key}")
                else:
                    print(f"[audit] Uploaded {os.path.basename(file_path)} to S3: s3://{bucket}/{key}")
            except Exception as upload_exc:
                note_upload_error(file_path, upload_exc)
                # Try to save to local as last resort
                try:
                    local_path = save_to_local_fallback(file_path, audit_id)
                    uploaded_files.append({
                        "bucket": None,
                        "key": local_path,
                        "region": None,
                        "filename": os.path.basename(file_path),
                        "mime_type": mimetypes.guess_type(file_path)[0] or "application/octet-stream",
                        "size": os.path.getsize(file_path),
                        "type": describe_report_file(file_path),
                        "storage": "local",
                        "local_path": local_path,
                    })
                    print(f"[audit] Saved {os.path.basename(file_path)} to local fallback after upload error")
                except Exception as local_exc:
                    print(f"[audit] Failed to save to local fallback: {local_exc}")

        if not uploaded_files:
            print("[audit] No report artifacts were uploaded to S3; findings stored in MongoDB only.")

        primary_file = (
            next((f for f in uploaded_files if f.get("type") == "json-ocsf"), None)
            or next((f for f in uploaded_files if f.get("type") == "json"), None)
            or (uploaded_files[0] if uploaded_files else None)
        )

        base_user_info = {
            "name": payload.get("name"),
            "email": payload.get("email"),
            "purpose": payload.get("purpose"),
            "officeEmail": office_email,
            "provider": provider,
        }
        created_at = raw_findings[0].get("time_dt") if raw_findings else datetime.utcnow().isoformat()

        results_update = {
            "audit_id": audit_id,
            "user_id": user_id,
            "data": findings,
            "metadata": metadata,
            "user_info": base_user_info,
            "created_at": created_at,
            "report_files": uploaded_files,
            "upload_errors": upload_errors,
        }
        metadata_update = {
            "status": "completed",
            "metadata": metadata,
            "report_files": uploaded_files,
            "completed_at": datetime.utcnow(),
            "upload_errors": upload_errors,
        }
        unset_results: dict[str, int] = {}
        unset_metadata: dict[str, int] = {}

        if primary_file:
            # Handle both S3 and local storage
            is_local = primary_file.get("storage") == "local" or primary_file.get("bucket") == "local"
            if is_local:
                # Store local file path
                results_update.update(
                    {
                        "s3_report_bucket": None,
                        "s3_report_key": primary_file.get("local_path") or primary_file["key"],
                        "s3_report_region": None,
                        "report_storage": "local",
                    }
                )
                metadata_update.update(
                    {
                        "report_s3_bucket": None,
                        "report_s3_key": primary_file.get("local_path") or primary_file["key"],
                        "report_s3_region": None,
                        "report_storage": "local",
                    }
                )
            else:
                # Store S3 info
                results_update.update(
                    {
                        "s3_report_bucket": primary_file["bucket"],
                        "s3_report_key": primary_file["key"],
                        "s3_report_region": primary_file.get("region") or AWS_REGION,
                        "report_storage": "s3",
                    }
                )
                metadata_update.update(
                    {
                        "report_s3_bucket": primary_file["bucket"],
                        "report_s3_key": primary_file["key"],
                        "report_s3_region": primary_file.get("region") or AWS_REGION,
                        "report_storage": "s3",
                    }
                )
        else:
            unset_results = {
                "s3_report_bucket": 1,
                "s3_report_key": 1,
                "s3_report_region": 1,
                "report_storage": 1,
            }
            unset_metadata = {
                "report_s3_bucket": 1,
                "report_s3_key": 1,
                "report_s3_region": 1,
                "report_storage": 1,
            }

        result_update_doc = {"$set": results_update}
        if unset_results:
            result_update_doc["$unset"] = unset_results
        
        # Ensure data field is always an array, even if empty
        if "data" not in results_update or not isinstance(results_update["data"], list):
            results_update["data"] = []
            result_update_doc["$set"]["data"] = []
        
        print(f"[audit] Storing {len(findings)} findings in results collection for audit {audit_id}")
        result = results_collection.update_one(
            {"audit_id": audit_id, "user_id": user_id},
            result_update_doc,
            upsert=True,
        )
        print(f"[audit] Results collection update result: matched={result.matched_count}, modified={result.modified_count}, upserted_id={result.upserted_id}")

        metadata_update_doc = {"$set": metadata_update}
        if unset_metadata:
            metadata_update_doc["$unset"] = unset_metadata
        metadata_collection.update_one(
            {"audit_id": audit_id, "user_id": user_id},
            metadata_update_doc,
        )

        print(f"[audit] Audit {audit_id} completed successfully")

        callback_payload = {
            "audit_id": audit_id,
            "status": "completed",
            "user_id": user_id,
        }
        if primary_file:
            is_local = primary_file.get("storage") == "local" or primary_file.get("bucket") == "local"
            if is_local:
                callback_payload.update(
                    {
                        "report_s3_bucket": None,
                        "report_s3_key": primary_file.get("local_path") or primary_file["key"],
                        "report_s3_region": None,
                        "report_storage": "local",
                    }
                )
            else:
                callback_payload.update(
                    {
                        "report_s3_bucket": primary_file["bucket"],
                        "report_s3_key": primary_file["key"],
                        "report_s3_region": primary_file.get("region") or AWS_REGION,
                        "report_storage": "s3",
                    }
                )
        if upload_errors:
            callback_payload["upload_errors"] = [
                {**err, "timestamp": err["timestamp"].isoformat()} for err in upload_errors
            ]

        if payload.get("callback_url"):
            print(f"[callback] Sending success callback for audit {audit_id}")
            try:
                response = requests.post(
                    payload["callback_url"],
                    json=callback_payload,
                    timeout=10,
                )
                print(f"[callback] Callback sent (status: {response.status_code})")
            except Exception as exc:
                print(f"[callback] Failed to send callback: {exc}")

        if office_email:
            send_email(
                "KloudRaksha Audit Completed",
                f"Your {provider.upper()} security audit ({audit_id}) has completed successfully.\n\n"
                f"Summary:\n"
                f"- Total findings: {metadata.get('total_findings', 0)}\n"
                f"- Failed checks: {metadata.get('failed_findings', 0)}\n"
                f"- Critical: {metadata.get('critical_findings', 0)}\n"
                f"- High: {metadata.get('high_findings', 0)}\n"
                f"- Medium: {metadata.get('medium_findings', 0)}\n"
                f"- Low: {metadata.get('low_findings', 0)}",
                office_email,
            )

    except subprocess.TimeoutExpired:
        error_msg = "Prowler scan timed out after 30 minutes"
        print(f"[audit] {error_msg} for audit {audit_id}")
        metadata_collection.update_one(
            {"audit_id": audit_id, "user_id": user_id},
            {
                "$set": {
                    "status": "failed",
                    "error": error_msg,
                    "failed_at": datetime.utcnow(),
                    "upload_errors": upload_errors,
                }
            },
        )
        if payload.get("callback_url"):
            try:
                requests.post(
                    payload["callback_url"],
                    json={
                        "audit_id": audit_id,
                        "status": "failed",
                        "error": error_msg,
                        "user_id": user_id,
                        "upload_errors": [
                            {**err, "timestamp": err["timestamp"].isoformat()} for err in upload_errors
                        ],
                    },
                    timeout=10,
                )
                print(f"[callback] Failure callback sent")
            except Exception as callback_exc:
                print(f"[callback] Failed to send failure callback: {callback_exc}")
    except Exception as exc:
        error_msg = str(exc)
        print(f"[audit] Failed audit {audit_id}: {error_msg}")
        metadata_collection.update_one(
            {"audit_id": audit_id, "user_id": user_id},
            {
                "$set": {
                    "status": "failed",
                    "error": error_msg,
                    "failed_at": datetime.utcnow(),
                    "upload_errors": upload_errors,
                }
            },
        )
        if payload.get("callback_url"):
            try:
                requests.post(
                    payload["callback_url"],
                    json={
                        "audit_id": audit_id,
                        "status": "failed",
                        "error": error_msg,
                        "user_id": user_id,
                        "upload_errors": [
                            {**err, "timestamp": err["timestamp"].isoformat()} for err in upload_errors
                        ],
                    },
                    timeout=10,
                )
                print(f"[callback] Failure callback sent")
            except Exception as callback_exc:
                print(f"[callback] Failed to send failure callback: {callback_exc}")
    finally:
        _remove_docker_volume(output_volume)
        cleanup_container(container_name)
        if RAW_REPORT_RETENTION_DAYS > 0:
            delay = RAW_REPORT_RETENTION_DAYS * 86400
            threading.Timer(
                delay,
                shutil.rmtree,
                args=(work_dir,),
                kwargs={"ignore_errors": True},
            ).start()
            print(f"[audit] Cleanup scheduled for audit {audit_id} in {RAW_REPORT_RETENTION_DAYS} days")
        else:
            shutil.rmtree(work_dir, ignore_errors=True)
            print(f"[audit] Cleaned up resources for audit {audit_id}")
@main.route("/run-audit", methods=["POST"])
def run_audit():
    """API endpoint to start a new audit."""
    data = request.get_json() or {}
    print(f"[audit] Received audit request: provider={data.get('provider')}, user_id={data.get('user_id')}, audit_id={data.get('audit_id')}")
    
    required = [
        "user_id",
        "audit_id",
        "callback_url",
        "name",
        "email",
        "purpose",
        "office_email",
        "provider",
    ]
    
    missing_fields = [field for field in required if not data.get(field)]
    if missing_fields:
        return jsonify({"error": f"Missing required fields: {', '.join(missing_fields)}"}), 400

    if data.get("provider") != "aws":
        return jsonify({"error": "Only AWS provider is supported currently"}), 400

    if not data.get("aws_access_key") or not data.get("aws_secret_key"):
        return jsonify({"error": "AWS credentials are required"}), 400

    # Start audit in background thread
    threading.Thread(target=run_audit_in_thread, args=(data,), daemon=True).start()

    return (
        jsonify(
            {
                "message": "Audit started successfully",
                "audit_id": data["audit_id"],
                "status": "queued",
            }
        ),
        202,
    )


@main.route("/audit/<string:audit_id>/status", methods=["GET"])
def get_audit_status(audit_id):
    """Get the status of a specific audit."""
    audit = metadata_collection.find_one({"audit_id": audit_id})
    if not audit:
        return jsonify({"error": "Audit not found"}), 404

    results = results_collection.find_one({"audit_id": audit_id})
    
    response = {
        "audit_id": audit_id,
        "status": audit.get("status"),
        "provider": audit.get("provider"),
        "started_at": audit.get("started_at"),
        "completed_at": audit.get("completed_at"),
        "results": results.get("data") if results else None,
        "metadata": results.get("metadata") if results else None,
    }
    
    if audit.get("error"):
        response["error"] = audit.get("error")
    
    return jsonify(response)


@main.route("/user/<string:user_id>/audits", methods=["GET"])
def get_audits_for_user(user_id):
    """Get all audits for a specific user."""
    audit_metadata = metadata_collection.find(
        {"user_id": user_id},
        {"audit_id": 1, "status": 1, "provider": 1, "started_at": 1, "completed_at": 1}
    ).sort("started_at", -1)
    
    audits = [
        {
            "audit_id": str(doc.get("audit_id")),
            "status": doc.get("status"),
            "provider": doc.get("provider"),
            "started_at": doc.get("started_at"),
            "completed_at": doc.get("completed_at"),
        }
        for doc in audit_metadata
        if doc.get("audit_id")
    ]
    
    if not audits:
        return jsonify({"message": "No audits found for this user.", "audits": []}), 200
    
    return jsonify({"user_id": user_id, "audits": audits})


@main.route("/admin/audits", methods=["GET"])
def get_all_audits():
    """Get all audits for admin view."""
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 50))
    status_filter = request.args.get("status")
    provider_filter = request.args.get("provider")
    user_id_filter = request.args.get("user_id")

    query = {}
    if status_filter:
        query["status"] = status_filter
    if provider_filter:
        query["provider"] = provider_filter
    if user_id_filter:
        query["user_id"] = user_id_filter

    skip = (page - 1) * limit
    audit_cursor = metadata_collection.find(query).sort("started_at", -1).skip(skip).limit(limit)
    
    audits = []
    for audit in audit_cursor:
        audit_data = {
            "audit_id": str(audit.get("audit_id")),
            "user_id": audit.get("user_id"),
            "status": audit.get("status"),
            "provider": audit.get("provider"),
            "started_at": audit.get("started_at"),
            "completed_at": audit.get("completed_at"),
            "user_info": audit.get("user_info", {}),
            "metadata": audit.get("metadata", {}),
            "error": audit.get("error"),
            "upload_errors": audit.get("upload_errors", []),
        }
        audits.append(audit_data)

    total_count = metadata_collection.count_documents(query)
    total_pages = (total_count + limit - 1) // limit

    return jsonify({
        "audits": audits,
        "pagination": {
            "page": page,
            "limit": limit,
            "total_count": total_count,
            "total_pages": total_pages,
        }
    })


@main.route("/admin/audit/<string:audit_id>", methods=["GET"])
def get_admin_audit_details(audit_id):
    """Get detailed audit information for admin, including findings."""
    audit = metadata_collection.find_one({"audit_id": audit_id})
    if not audit:
        return jsonify({"error": "Audit not found"}), 404

    results = results_collection.find_one({"audit_id": audit_id})
    
    response = {
        "audit_id": audit_id,
        "user_id": audit.get("user_id"),
        "status": audit.get("status"),
        "provider": audit.get("provider"),
        "started_at": audit.get("started_at"),
        "completed_at": audit.get("completed_at"),
        "user_info": audit.get("user_info", {}),
        "metadata": audit.get("metadata", {}),
        "report_files": audit.get("report_files", []),
        "upload_errors": audit.get("upload_errors", []),
        "error": audit.get("error"),
        "findings": results.get("data", []) if results else [],
        "findings_metadata": results.get("metadata", {}) if results else {},
        "s3_report_bucket": audit.get("report_s3_bucket"),
        "s3_report_key": audit.get("report_s3_key"),
        "s3_report_region": audit.get("report_s3_region"),
        "report_storage": audit.get("report_storage"),
    }
    
    return jsonify(response)


@main.route("/admin/stats", methods=["GET"])
def get_admin_stats():
    """Get overall statistics for admin dashboard."""
    total_audits = metadata_collection.count_documents({})
    completed_audits = metadata_collection.count_documents({"status": "completed"})
    failed_audits = metadata_collection.count_documents({"status": "failed"})
    pending_audits = metadata_collection.count_documents({"status": {"$in": ["pending", "reviewing"]}})

    # Get recent audits
    recent_audits = list(metadata_collection.find().sort("started_at", -1).limit(10))
    recent_audits_data = []
    for audit in recent_audits:
        recent_audits_data.append({
            "audit_id": str(audit.get("audit_id")),
            "user_id": audit.get("user_id"),
            "status": audit.get("status"),
            "provider": audit.get("provider"),
            "started_at": audit.get("started_at"),
            "completed_at": audit.get("completed_at"),
            "user_info": audit.get("user_info", {}),
        })

    # Aggregate findings stats
    pipeline = [
        {"$match": {"status": "completed"}},
        {"$lookup": {
            "from": "results",
            "localField": "audit_id",
            "foreignField": "audit_id",
            "as": "results"
        }},
        {"$unwind": {"path": "$results", "preserveNullAndEmptyArrays": True}},
        {"$group": {
            "_id": None,
            "total_findings": {"$sum": {"$ifNull": ["$results.metadata.total_findings", 0]}},
            "failed_findings": {"$sum": {"$ifNull": ["$results.metadata.failed_findings", 0]}},
            "critical_findings": {"$sum": {"$ifNull": ["$results.metadata.critical_findings", 0]}},
            "high_findings": {"$sum": {"$ifNull": ["$results.metadata.high_findings", 0]}},
            "medium_findings": {"$sum": {"$ifNull": ["$results.metadata.medium_findings", 0]}},
            "low_findings": {"$sum": {"$ifNull": ["$results.metadata.low_findings", 0]}},
        }}
    ]
    
    findings_stats = list(metadata_collection.aggregate(pipeline))
    findings_data = findings_stats[0] if findings_stats else {
        "total_findings": 0,
        "failed_findings": 0,
        "critical_findings": 0,
        "high_findings": 0,
        "medium_findings": 0,
        "low_findings": 0,
    }

    return jsonify({
        "total_audits": total_audits,
        "completed_audits": completed_audits,
        "failed_audits": failed_audits,
        "pending_audits": pending_audits,
        "findings_stats": findings_data,
        "recent_audits": recent_audits_data,
    })


@main.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint."""
    try:
        # Check MongoDB connection
        mongo_client.admin.command('ping')
        mongo_healthy = True
    except Exception as exc:
        mongo_healthy = False
        print(f"[health] MongoDB unhealthy: {exc}")
    
    # Check Docker availability
    try:
        subprocess.run(["docker", "version"], capture_output=True, timeout=5, check=True)
        docker_healthy = True
    except Exception as exc:
        docker_healthy = False
        print(f"[health] Docker unhealthy: {exc}")
    
    healthy = mongo_healthy and docker_healthy
    
    return jsonify({
        "status": "healthy" if healthy else "unhealthy",
        "mongodb": "ok" if mongo_healthy else "error",
        "docker": "ok" if docker_healthy else "error",
    }), 200 if healthy else 503


@main.route("/ping", methods=["GET"])
def ping():
    """Simple ping endpoint."""
    return jsonify({"message": "pong"})


@main.route("/reports/<string:audit_id>/<path:filename>", methods=["GET"])
def serve_local_report(audit_id: str, filename: str):
    """Serve report files from local storage."""
    try:
        from flask import send_file, abort
        
        file_path = os.path.join(LOCAL_REPORTS_DIR, audit_id, filename)
        
        if not os.path.exists(file_path):
            return jsonify({"error": "File not found"}), 404
        
        if not os.path.isfile(file_path):
            return jsonify({"error": "Not a file"}), 400
        
        # Security check: ensure file is within LOCAL_REPORTS_DIR
        real_path = os.path.realpath(file_path)
        real_base = os.path.realpath(LOCAL_REPORTS_DIR)
        if not real_path.startswith(real_base):
            return jsonify({"error": "Invalid file path"}), 403
        
        return send_file(file_path, as_attachment=True, download_name=filename)
    except Exception as exc:
        print(f"[serve_local_report] Error serving file: {exc}")
        return jsonify({"error": "Failed to serve file"}), 500


def describe_report_file(file_path: str) -> str:
    """Infer a friendly type label for the generated report file."""
    name = os.path.basename(file_path).lower()
    if name.endswith(".html"):
        return "html"
    if "json-ocsf" in name or "ocsf" in name:
        return "json-ocsf"
    if name.endswith(".json"):
        return "json"
    if name.endswith(".csv"):
        return "csv"
    if name.endswith(".pdf"):
        return "pdf"
    return "raw"
