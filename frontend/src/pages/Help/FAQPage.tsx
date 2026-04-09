import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is KloudRaksha?",
    answer:
      "KloudRaksha is a comprehensive cloud security scanning platform that helps organizations identify and remediate security vulnerabilities across their cloud infrastructure. It provides continuous monitoring, detailed reports, and actionable insights to improve your cloud security posture.",
  },
  {
    question: "How does the scanning process work?",
    answer:
      "Our platform performs automated security scans of your cloud infrastructure by analyzing configurations, permissions, and security settings. It checks against industry best practices and compliance standards, generating detailed reports highlighting potential vulnerabilities and providing remediation steps.",
  },
  {
    question: "What types of security findings are reported?",
    answer:
      "We categorize findings by severity (Critical, High, Medium, Low) and cover various aspects including misconfigured services, excessive permissions, compliance violations, and potential security risks. Each finding includes detailed information and recommended fixes.",
  },
  {
    question: "How often should I run security scans?",
    answer:
      "We recommend running scans at least weekly, but the frequency can be adjusted based on your organization's needs. Enterprise users can enable continuous monitoring for real-time security insights.",
  },
  {
    question: "What cloud providers do you support?",
    answer:
      "Currently, we support major cloud providers including AWS, Azure, and Google Cloud Platform. Our platform can scan multi-cloud environments and provide unified security insights across all your cloud resources.",
  },
  {
    question: "How do I interpret the scan results?",
    answer:
      "Scan results are presented in an easy-to-understand dashboard showing findings by severity, status, and trends over time. Each finding includes detailed explanations and step-by-step remediation guidance.",
  },
  {
    question: "What's included in the Enterprise plan?",
    answer:
      "The Enterprise plan includes advanced features such as continuous monitoring, custom compliance frameworks, API access, priority support, and unlimited scans. It also provides team collaboration features and detailed audit logs.",
  },
  {
    question: "How do I get started with KloudRaksha?",
    answer:
      "Getting started is easy! Simply sign up for an account, connect your cloud provider(s), and run your first scan. Our platform will guide you through the setup process and provide immediate insights into your cloud security posture.",
  },
];

export default function FAQPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
    },
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-3xl mx-auto space-y-8"
      >
        <motion.div variants={itemVariants} className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-muted-foreground">
            Find answers to common questions about KloudRaksha's cloud security
            scanning platform
          </p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card border rounded-lg px-4"
              >
                <AccordionTrigger className="text-lg hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="mt-12 text-center p-6 bg-card border rounded-lg"
        >
          <h2 className="text-xl font-semibold mb-4">Still have questions?</h2>
          <p className="text-muted-foreground mb-4">
            Our support team is here to help you with any questions or concerns.
          </p>
          <button className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors">
            Contact Support
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
