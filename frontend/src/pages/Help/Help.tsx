import React from "react";
import FAQs from "./FAQ's";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";

const Help: React.FC = () => {
    return (
        <>
            <Navbar />
            <div className="bg-gray-100 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-extrabold text-gray-900">
                            Need Help?
                        </h2>
                        <p className="mt-4 text-lg text-gray-500">
                            Got questions? We've got answers. If you have other
                            questions, feel free to contact us.
                        </p>
                    </div>
                </div>
                <FAQs />
            </div>
            <Footer />
        </>
    );
};

export default Help;
