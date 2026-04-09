import React, { useState } from "react";

interface FAQ {
    question: string;
    answer: string;
}

const FAQs: React.FC = () => {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const faqsData: FAQ[] = [
        {
            question:
                "What is KloudRaksha?",
            answer: "KloudRaksha is a cloud security and compliance platform designed to protect businesses from vulnerabilities, misconfigurations, and threats across cloud environments. It helps organizations stay secure, audit-ready, and compliant with industry standards.",
        },
        {
            question:
                "How does KloudRaksha secure my cloud environment?",
            answer: "We provide continuous monitoring, vulnerability detection, compliance checks, and automated reporting. KloudRaksha identifies risks in real-time and offers remediation steps, ensuring your cloud infrastructure is always protected.",
        },
        {
            question:
                "Which cloud providers are supported?",
            answer: "Currently, KloudRaksha supports major cloud platforms including AWS, Microsoft Azure, and Google Cloud Platform (GCP). We are constantly expanding our integrations to support more services and multi-cloud environments.",
        },
        {
            question:
                "Can KloudRaksha help with compliance and audits?",
            answer: "Yes. KloudRaksha provides pre-built compliance frameworks such as ISO 27001, SOC 2, PCI-DSS, HIPAA, and GDPR. Our automated reports simplify internal audits and external regulatory assessments.",
        },
    ];

    const toggleFAQ = (index: number) => {
        if (activeIndex === index) {
            setActiveIndex(null);
        } else {
            setActiveIndex(index);
        }
    };

    return (
        <>
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-gray-800">
                <h1 className="text-4xl font-bold mb-10 mt-20 uppercase text-center">
                    FAQs
                </h1>
                {faqsData.map((faq, index) => (
                    <div
                        key={index}
                        className="border p-4 mb-4 rounded-lg cursor-pointer transition ease-in-out duration-300 transform hover:shadow-md"
                        onClick={() => toggleFAQ(index)}
                    >
                        <h2 className="text-lg font-medium">{faq.question}</h2>
                        <div
                            className={`mt-2 ${
                                activeIndex === index ? "block" : "hidden"
                            }`}
                        >
                            <p>{faq.answer}</p>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};

export default FAQs;
