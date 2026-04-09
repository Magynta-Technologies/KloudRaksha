import subprocess
import json
import os
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from bs4 import BeautifulSoup
import boto3
from pymongo.mongo_client import MongoClient, ReplaceOne
from pymongo.server_api import ServerApi
from datetime import datetime 
import uuid
import io
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fpdf import FPDF



uri = "mongodb+srv://ameyasurana10:tbEYngJu8jFxvp70@cluster0.pnz20.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
access_key = ""
secret_key = ""


def configure_aws(access_key, secret_key, region , output_format):
    subprocess.run([
        'aws', 'configure', 'set', 'aws_access_key_id', access_key
    ], check=True)
    subprocess.run([
        'aws', 'configure', 'set', 'aws_secret_access_key', secret_key
    ], check=True)
    subprocess.run([
        'aws', 'configure', 'set', 'region', region
    ], check=True)
    subprocess.run([
        'aws', 'configure', 'set', 'output', output_format
    ], check=True)

def send_email(subject: str, body: str, recipient: str, sender_email: str, sender_password: str):
    try:
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = recipient
        msg['Subject'] = subject

        msg.attach(MIMEText(body, 'plain'))

        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls()  
            server.login(sender_email, sender_password)  
            server.sendmail(sender_email, recipient, msg.as_string())  
            print("Email sent successfully!")

    except Exception as e:
        print(f"Failed to send email: {e}")



def store_prowler_findings_in_single_doc(
    findings, aws_account_id, user_id, audit_id, name, email, purpose, office_email, provider,
    aws_secret_key=None, aws_secret_password=None,
    azure_client_id=None, azure_client_secret=None, azure_tenant_id=None,
    gcp_client_id=None, gcp_client_secret=None, gcp_tenant_id=None
):
    print("\nAttempting to store findings in MongoDB as a single document...")
    try:
        client = MongoClient(uri, server_api=ServerApi('1'))
        db = client['test']
        collection = db['scanrequests']
        
        print("Connected to MongoDB successfully")
        
        failed_findings = len([f for f in findings if f.get('Compliance', {}).get('Status') == 'FAILED'])
        metadata = {
            "aws_account_id": aws_account_id,
            "total_findings": len(findings),
            "failed_findings": failed_findings,
            'passed_findings': len([f for f in findings if f.get('Compliance', {}).get('Status') == 'PASSED']),
            'critical_findings': len([f for f in findings if f.get('Severity', {}).get('Label') == 'CRITICAL']),
            'high_findings': len([f for f in findings if f.get('Severity', {}).get('Label') == 'HIGH']),
            'medium_findings': len([f for f in findings if f.get('Severity', {}).get('Label') == 'MEDIUM']),
            'low_findings': len([f for f in findings if f.get('Severity', {}).get('Label') == 'LOW']),
        }
        
        # Create provider-specific credentials object
        credentials = {}
        if provider == 'aws':
            credentials['aws'] = {
                'awsSecretKey': aws_secret_key,
                'awsSecretPassword': aws_secret_password
            }
        elif provider == 'azure':
            credentials['azure'] = {
                'clientId': azure_client_id,
                'clientSecret': azure_client_secret,
                'tenantId': azure_tenant_id
            }
        elif provider == 'gcp':
            credentials['gcp'] = {
                'clientId': gcp_client_id,
                'clientSecret': gcp_client_secret,
                'tenantId': gcp_tenant_id
            }
        
        user_info = {
            "name": name,
            "email": email,
            "purpose": purpose,
            "officeEmail": office_email,
        }
        
        audit_document = {
            "metadata": metadata,
            "data": findings,
            "created_at": datetime.now(),
            "user_id": user_id,
            "audit_id": audit_id,
            "user_info": user_info,
            "is_verified": False,
            "status": "pending",
            "provider": provider
        }
        
        print("Inserting the audit document...")
        inserted_id = collection.insert_one(audit_document).inserted_id
        print(f"Audit document inserted with ID: {inserted_id}")
        
        return True

    except Exception as e:
        print(f"Error in store_prowler_findings_in_single_doc: {e}")
        return False

def run_prowler(region, output_format, output_file, output_directory):
    if os.path.exists(output_directory+"/"+output_file+".asff.json"):
        os.remove(output_directory+"/"+output_file+".asff.json")
        print(f"Deleted existing output file: {output_file}")

    result = subprocess.run([
        'prowler','aws','-f',region, '--output-modes', *output_format,'--output-filename',output_file,'--output-directory', output_directory
    ], capture_output=True, text=True)
    
    if result.returncode != 0:
        print("Error running Prowler:", result.stderr)
        return None
    
def save_output_to_file(output_directory, output_filename):
    local_path = os.path.join(os.getcwd(), output_filename)
    
    if os.path.exists(os.path.join(output_directory, output_filename)):
        subprocess.run(['cp', os.path.join(output_directory, output_filename), local_path], check=True)
        print(f"Output saved to {local_path}")
    else:
        print(f"Error: Output file {output_filename} not found in {output_directory}.")


def generate_and_upload_pdf(audits, bucket_name, user_id, audit_id, file_name):
    class SecurityAuditPDF(FPDF):
        def __init__(self):
            super().__init__()
            self.set_auto_page_break(auto=True, margin=10)  # Reduced margin
            self.set_margins(10, 10, 10)  # Reduced margins

        def draw_borders(self):
            # Main border
            self.rect(5, 5, self.w - 10, self.h - 10)

            # Header separator
            self.line(5, 20, self.w - 5, 20)

            # Vertical line for sidebar
            self.line(65, 20, 65, self.h - 5)

            # Sidebar section boxes
            y_positions = [45, 75, 105]
            for y in y_positions:
                self.line(5, y, 65, y)

        def header(self):
            self.set_fill_color(245, 245, 245)
            self.rect(5, 5, self.w - 10, 15, 'F')


            self.set_fill_color(87, 217, 23)
            self.rect(7, 7, 30, 10, 'F')
            self.set_font('Arial', 'B', 8)
            self.set_text_color(255, 255, 255)
            self.text(12, 13, 'LOW')

            self.set_font('Arial', '', 7)
            self.set_text_color(0, 0, 0)
            self.text(40, 12, 'Internal')
            self.text(40, 16, 'External')
            self.text(60, 12, 'Black-box')
            self.text(60, 16, 'Grey-box')
            self.text(self.w / 2 - 5, 14, 'Affected Service: AWS')

            self.set_text_color(0, 0, 255)
            self.text(self.w / 2 + 40, 14, 'Vulnerability Overview')
            self.text(self.w - 25, 14, 'Index')

            self.draw_borders()
            self.ln(10)

        def footer(self):
            self.line(5, self.h - 15, self.w - 5, self.h - 15)

            self.set_font('Arial', '', 8)
            self.set_text_color(0, 128, 0)
            self.text(10, self.h - 10, 'Newtons Apple')

            self.set_text_color(255, 0, 0)
            self.text(self.w / 2 - 15, self.h - 10, 'Confidential')

            self.set_text_color(0, 128, 0)
            self.text(self.w - 50, self.h - 10, 'www.newtonsapple.in')

            self.set_text_color(0, 0, 0)
            self.text(self.w - 10, self.h - 10, str(self.page_no()))

        def add_finding(self, data):
            self.add_page()  # Add a new page for each finding
            current_y = 25

            # Reference Links section
            self.set_xy(10, current_y)
            self.set_font('Arial', 'B', 9)
            self.set_text_color(0, 0, 0)
            self.cell(50, 6, 'Reference Links', 0, 1)

            self.set_font('Arial', '', 8)
            self.set_text_color(0, 0, 255)
            self.cell(50, 5, 'Reference Link', 0, 1, link=data['Remediation']['Recommendation']['Url'])

            # Ownership section
            current_y = 50
            self.set_xy(10, current_y)
            self.set_font('Arial', 'B', 9)
            self.set_text_color(0, 0, 0)
            self.cell(50, 6, 'Ownership', 0, 1)

            self.set_font('Arial', '', 8)
            self.cell(50, 5, 'Cloud Team - demo', 0, 1)

            # Retest Results section
            current_y = 75
            self.set_xy(10, current_y)
            self.set_font('Arial', 'B', 9)
            self.cell(50, 6, 'Retest Results', 0, 1)

            self.set_font('Arial', '', 8)
            self.set_text_color(192, 192, 192)
            for status in ['Fixed', 'Not Fixed', 'Mitigated', 'Risk Accepted', 'Risk Transferred']:
                current_y += 5
                self.set_xy(10, current_y)
                self.cell(50, 5, status, 0, 1)

            # Main content - Aligned
            self.set_xy(70, 25)
            self.set_font('Arial', 'B', 9)
            self.set_text_color(0, 0, 255)
            self.cell(0, 6, f"Vulnerability: {data['Title']}", 0, 1)

            self.set_xy(70, 31)  # Move the cursor slightly below the title
            self.set_font('Arial', '', 8)
            self.set_text_color(0, 0, 0)
            self.multi_cell(self.w - 85, 4, data['Description'])

            # Solution section
            current_y = self.get_y() + 3
            self.set_xy(70, current_y)
            self.set_font('Arial', 'B', 9)
            self.cell(0, 6, 'Solution:', 0, 1)

            self.set_xy(70, current_y + 6)
            self.set_font('Arial', '', 8)
            self.multi_cell(self.w - 85, 4, data['Remediation']['Recommendation']['Text'])


    try:
        # Instantiate the PDF generator
        pdf = SecurityAuditPDF()

        # Add findings to the PDF
        for audit in audits:
            pdf.add_finding(audit)

        # Generate the PDF content
        pdf_output = pdf.output(dest='S').encode('latin1')

        # Upload to S3
        session = boto3.Session()
        s3 = session.client('s3')

        s3_key = f"{user_id}/{audit_id}/{file_name}"
        s3.put_object(
            Bucket=bucket_name,
            Key=s3_key,
            Body=pdf_output,
            ContentType='application/pdf'
        )

        # Generate public URL
        public_url = f"https://{bucket_name}.s3.amazonaws.com/{s3_key}"
        print(f"PDF uploaded successfully. Public URL: {public_url}")
        return public_url

    except Exception as e:
        print(f"Error generating and uploading PDF: {e}")
        return None
    
# def generate_and_upload_pdf(audits, bucket_name, user_id, audit_id, file_name):
#     try:
#         pdf_buffer = io.BytesIO()
#         c = canvas.Canvas(pdf_buffer, pagesize=letter)
#         width, height = letter
        
#         BLUE = (0.2, 0.3, 0.7)
#         LIGHT_GRAY = (0.9, 0.9, 0.9)
#         DARK_GRAY = (0.4, 0.4, 0.4)
        
#         def add_header():
#             c.setFillColorRGB(0.2, 0.3, 0.7)
#             c.rect(40, height - 80, width - 80, 50, fill=1)
#             c.setFillColorRGB(1, 1, 1)
#             c.setFont("Helvetica-Bold", 24)
#             c.drawString(50, height - 50, "AWS Security Audit Report")
#             c.setFont("Helvetica", 12)
#             c.drawString(50, height - 70, datetime.now().strftime("%d %B %Y"))
        
#         def add_footer(page_num):
#             c.setFillColorRGB(*DARK_GRAY)
#             c.setFont("Helvetica", 8)
#             c.drawString(width/2 - 40, 30, f"Page {page_num}")
#             c.drawString(40, 30, "Generated by KloudRaksha Security")
        
#         def add_summary(total_count, severity_counts):
#             c.setFont("Helvetica-Bold", 14)
#             c.setFillColorRGB(0, 0, 0)
#             c.drawString(40, height - 110, "Executive Summary")
            
#             c.setFillColorRGB(*LIGHT_GRAY)
#             c.rect(40, height - 190, width - 80, 80, fill=1)  
#             c.setFillColorRGB(0, 0, 0)
            
#             c.setFont("Helvetica", 11)
#             y = height - 140
#             c.drawString(50, y, f"Total Findings: {total_count}")
#             c.drawString(50, y - 20, f"Severity Distribution:")
#             c.drawString(70, y - 40, f"Critical: {severity_counts['CRITICAL']} | High: {severity_counts['HIGH']}")
#             c.drawString(70, y - 60, f"Medium: {severity_counts['MEDIUM']} | Low: {severity_counts['LOW']}")
    
#         def draw_finding(finding, y_position):
#             severity_colors = {
#                 'CRITICAL': (0.6, 0, 0),
#                 'HIGH': (0.8, 0.2, 0.2),
#                 'MEDIUM': (0.8, 0.6, 0.2),
#                 'LOW': (0.4, 0.6, 0.2),
#                 'INFORMATIONAL': (0.5, 0.5, 0.5)  
#             }
            
#             c.setFillColorRGB(*LIGHT_GRAY)
#             c.rect(40, y_position - 110, width - 80, 120, fill=1)
            
#             c.setFillColorRGB(0, 0, 0)
#             c.setFont("Helvetica-Bold", 12)
#             c.drawString(50, y_position, finding.get('Title', 'No Title'))
            
#             severity = finding.get('Severity', {}).get('Label', 'UNKNOWN')
#             c.setFillColorRGB(*severity_colors.get(severity, (0, 0, 0)))
#             c.setFont("Helvetica", 10)
#             c.drawString(50, y_position - 20, f"Severity: {severity}")
            
#             c.setFillColorRGB(0, 0, 0)
#             c.setFont("Helvetica", 10)
            
#             description = finding.get('Description', 'No description available')
#             description_lines = wrap_text(description, 80)
#             y_desc = y_position - 40
#             for line in description_lines:
#                 c.drawString(50, y_desc, line)
#                 y_desc -= 15
                
#             c.setFont("Helvetica-Bold", 10)
#             compliance_status = finding.get('Compliance', {}).get('Status', 'UNKNOWN')
#             c.drawString(50, y_position - 85, f"Status: {compliance_status}")
            
#             c.setFont("Helvetica", 8)
#             c.setFillColorRGB(*BLUE)
#             url = finding.get('Remediation', {}).get('Recommendation', {}).get('Url', 'No URL available')
#             c.drawString(50, y_position - 100, "More Info: " + url)
            
#             return y_position - 130  
    
#         def wrap_text(text, width):
#             words = text.split()
#             lines = []
#             current_line = []
            
#             for word in words:
#                 current_line.append(word)
#                 if len(' '.join(current_line)) > width:
#                     current_line.pop()
#                     lines.append(' '.join(current_line))
#                     current_line = [word]
            
#             lines.append(' '.join(current_line))
#             return lines
#         page_num = 1
#         y_position = height - 220
        
#         severity_counts = {
#             'CRITICAL': 0,
#             'HIGH': 0,
#             'MEDIUM': 0,
#             'LOW': 0,
#             'INFORMATIONAL': 0
#         }
        
#         for audit in audits:
#             severity = audit.get('Severity', {}).get('Label', 'UNKNOWN')
#             if severity in severity_counts:
#                 severity_counts[severity] += 1
        
#         add_header()
#         add_summary(len(audits), severity_counts)
#         add_footer(page_num)
        
#         for audit in audits:
#             if y_position < 150:  
#                 c.showPage()
#                 page_num += 1
#                 add_header()
#                 add_footer(page_num)
#                 y_position = height - 220
                
#             y_position = draw_finding(audit, y_position)
        
#         c.save()
        
#         pdf_buffer.seek(0)
        
#         session = boto3.Session(
#             aws_access_key_id='',
#             aws_secret_access_key='',
#             region_name='ap-south-1'
#         )
#         s3 = session.client('s3')
        
#         s3_key = f"{user_id}/{audit_id}/{file_name}"
        
#         s3.put_object(
#             Bucket=bucket_name, 
#             Key=s3_key, 
#             Body=pdf_buffer.getvalue(),
#             ContentType='application/pdf'
#         )
        
#         public_url = f"https://{bucket_name}.s3.ap-south-1.amazonaws.com/{s3_key}"
#         print(f"PDF uploaded successfully. Public URL: {public_url}")
#         return public_url
    
#     except Exception as e:
#         print(f"Error generating and uploading PDF to S3: {e}")
#         return None

def extract_all_checks(prowler_output):
    all_audits = []
    for finding in prowler_output:
        if finding.get("Compliance", {}).get("Status") == "FAILED" or finding.get("Compliance", {}).get("Status") == "PASSED":
            all_audits.append(finding)
    print(f"Found {len(all_audits)} all audits.")
    return all_audits

def extract_passed_checks(prowler_output):
    passed_audits = []
    for finding in prowler_output:
        if finding.get("Compliance", {}).get("Status") == "PASSED":
            passed_audits.append(finding)
    print(f"Found {len(passed_audits)} passed audits.")
    return passed_audits

def extract_failed_checks(prowler_output):
    failed_audits = []
    for finding in prowler_output:
        if finding.get("Compliance", {}).get("Status") == "FAILED":
            failed_audits.append(finding)
    print(f"Found {len(failed_audits)} failed audits.")
    return failed_audits

def modify_html_output(output_directory, output_filename):
    html_file_path = os.path.join(output_directory, output_filename + ".html")
    
    with open(html_file_path, 'r') as file:
        content = file.read()
    
    soup = BeautifulSoup(content, 'html.parser')
    
    new_title = "Newtons Apple - KloudRaksha"
    title_tag = soup.find('title')
    if title_tag:
        title_tag.string = new_title
    
    logo_tag = soup.find('img', alt="prowler-logo")
    if logo_tag:
        logo_tag['src'] = "https://newtonsapple.in/assets/img/NEWTONS_APPLE_LOGO.png"
        logo_tag['style'] = "width: 100px; height: 60px;"
        logo_tag['width'] = "100"
        logo_tag['height'] = "60"
    
    anchor_tag = soup.find('a', href="https://github.com/prowler-cloud/prowler/")
    if anchor_tag:
        anchor_tag['href'] = "https://kloudraksha.com/"
    
    with open(html_file_path, 'w') as file:
        file.write(str(soup))

    print(f"Modified HTML output saved at {html_file_path}.")

def assume_role(account_id, role_name, role_session_name, external_id=None):
    sts_client = boto3.client('sts')
    
    role_arn = f'arn:aws:iam::{account_id}:role/{role_name}'

    try:
        if external_id:
            response = sts_client.assume_role(
                RoleArn=role_arn,
                RoleSessionName=role_session_name,
                ExternalId=external_id,
                DurationSeconds=3600
            )
        else:
            response = sts_client.assume_role(
                RoleArn=role_arn,
                RoleSessionName=role_session_name,
                DurationSeconds=3600
            )
        
        credentials = response['Credentials']
        return credentials
    
    except Exception as e:
        print(f"Error assuming role: {e}")
        return None

def main():
    region = "ap-south-1"
    output_formats = ["json-asff","html"]
    
    output_directory = "/opt/prowler_output"
    output_filename = "file"
    bucket_name = "kloudraksha" 
    office_email = os.getenv('office_email')
    subject = "Audit Report"
    body = "Audit has been initiated , sit back and relax. We will notify you once the audit is completed."
    access_key = os.getenv('AWS_ACCESS_KEY_ID')
    secret_key = os.getenv('AWS_SECRET_ACCESS_KEY')
    configure_aws(access_key, secret_key, region , "json")
    send_email(subject, body, office_email, "ameyasurana10@gmail.com", "hhho mtdg kwoo ktdm")
    run_prowler(region, output_formats, output_filename, output_directory)
    modify_html_output(output_directory, output_filename)
    save_output_to_file(output_directory, output_filename)
    
    json_file_path = f"{output_directory}/{output_filename}.asff.json"
    with open(json_file_path, 'r') as f:
        prowler_output = json.load(f)
    
    user_id = os.getenv('user_id')
    audit_id = os.getenv('audit_id')
    name = os.getenv('name')
    email = os.getenv('email')
    purpose = os.getenv('purpose')
    office_password = os.getenv('office_password')
    
    aws_account_id = prowler_output[0].get('AwsAccountId') if prowler_output else None
    if store_prowler_findings_in_single_doc(prowler_output, aws_account_id, user_id, audit_id, name, email, purpose, office_email, "aws", office_password):
        print("Successfully stored findings in MongoDB")
    else:
        print("Failed to store findings in MongoDB")
    
    all_audits = extract_all_checks(prowler_output)
    generate_and_upload_pdf(all_audits, bucket_name, user_id, audit_id, "all_audit_report.pdf")
    
    failed_audits = extract_failed_checks(prowler_output)
    generate_and_upload_pdf(failed_audits, bucket_name, user_id, audit_id, "failed_audit_report.pdf")
    
    passed_audits = extract_passed_checks(prowler_output)
    generate_and_upload_pdf(passed_audits, bucket_name, user_id, audit_id, "passed_audit_report.pdf")

if __name__ == "__main__":
    main()