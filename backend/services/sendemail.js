import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import 'dotenv/config'

let AWS_SES = null;
const SES_CONFIG = {
  region: "us-east-1",
  credentials: {
    accessKeyId: "",
    secretAccessKey: ""
  }
}
AWS_SES = new SESClient(SES_CONFIG)

const sendMail = async (receiverMail, subject, htmlContent, textContent) => {
  if (!AWS_SES) {
    console.log('Email sending disabled: SENDER_EMAIL not configured')
    return
  }
  const params = {
    Source: process.env.SENDER_EMAIL,
    Destination: {
      ToAddresses: [receiverMail]
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: htmlContent
        },
        Text: {
          Charset: 'UTF-8',
          Data: textContent
        }
      },
      Subject: {
        Charset: 'UTF-8',
        Data: subject
      }
    }
  }

  try {
    const command = new SendEmailCommand(params)
    const res = await AWS_SES.send(command)
    console.log('Email sent:', res)
    return res
  } catch (error) {
    console.error('Error sending email:', error)
    throw error
  }
}

export default sendMail
