# Base image with Python and Slim utilities
FROM python:3.9-slim

# Install necessary packages
RUN apt-get update && apt-get install -y \
    curl \
    unzip \
    git

# Install AWS CLI
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip awscliv2.zip && ./aws/install && rm -rf awscliv2.zip aws

# Clone Prowler repository
RUN git clone https://github.com/prowler-cloud/prowler /opt/prowler

# Set working directory
WORKDIR /opt/prowler

# Install Prowler dependencies
RUN pip install .

RUN pip install reportlab beautifulsoup4 boto3 pymongo FPDF

# Create a volume for saving the output to local machine
VOLUME ["/opt/prowler_output"]

# Copy the Python script
COPY audit_script.py /opt/prowler/

# Set the entry point to run the Python script
ENTRYPOINT ["python3", "/opt/prowler/audit_script.py"]
