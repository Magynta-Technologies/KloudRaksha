import React from "react";
import { FaQuestionCircle } from "react-icons/fa";
import { HiOutlineMail } from "react-icons/hi";
import FAQs from "../Help/FAQ's";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";

const SupportPage: React.FC = () => {
    const handleContactButtonClick = () => {
        window.location.href = "mailto:your-email@example.com";
    };

    return (
        <>
            <Navbar />
            <div className="bg-gray-100 min-h-screen flex flex-col justify-center py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap justify-center items-start">
                    <div className="w-full lg:w-1/2 mb-8 lg:mb-0">
                        <div className="text-center">
                            <h2 className="text-3xl font-extrabold text-gray-900 flex items-center justify-center">
                                Need Help? <FaQuestionCircle className="ml-2" />
                            </h2>
                            <p className="mt-4 text-lg text-gray-700">
                                Got questions? We've got answers. If you have
                                other questions, feel free to contact us.{" "}
                                <button
                                    onClick={handleContactButtonClick}
                                    className="flex items-center text-blue-500 font-bold focus:outline-none"
                                >
                                    Contact Us{" "}
                                    <HiOutlineMail className="ml-1" />
                                </button>
                            </p>
                            <p className="mt-4 text-lg text-gray-700">
                                Our support team is available 24/7 to assist you
                                with any inquiries or issues you may have. We
                                strive to provide timely and helpful responses
                                to ensure your satisfaction.
                            </p>
                        </div>
                    </div>
                    <div className="w-full lg:w-1/2">
                        <FAQs />
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default SupportPage;
