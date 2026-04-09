
//@ts-nocheck
import Footer from "@/components/Footer/Footer";
import Navbar from "@/components/Navbar/Navbar";
import React from "react";
import { FaBullseye, FaChartBar, FaCloud, FaCog, FaFileAlt, FaMoneyBillAlt } from "react-icons/fa";
import { Typewriter } from "react-simple-typewriter";
import bg2 from "../../images/Uploading-rafiki.png";
import { Fade, Slide } from "react-awesome-reveal";
import { useTheme } from "next-themes";
import { MagicCard } from "@/components/MagicCard/Magiccard";


const Landing: React.FC = () => {
    const { theme } = useTheme();
    return (
        <>
            <Navbar/>
            <div className="relative flex items-center justify-center min-h-screen ">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
                    <Fade triggerOnce={true} direction="left">
                        <div className="text-center lg:text-left">
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                                Welcome to <span className="text-[#2351E5]">Kloudraksha</span>
                                <br /><span className="text-[#6B8AFD]">
                                    <Typewriter
                                        words={["Secure Your Cloud.", "Optimize Your Cloud.", "Protect Your Cloud."]}
                                        cursorColor="black"
                                        loop={100}
                                        cursor
                                        cursorStyle="|"
                                        typeSpeed={40}
                                        deleteSpeed={30}
                                        delaySpeed={1500}
                                    />
                                </span>
                            </h1>
                            <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-8 max-w-lg">
                                Unlock the power of seamless cloud configuration audits with Kloudraksha. Revolutionizing compliance checks on cloud platforms, ensuring unparalleled efficiency and accuracy.
                            </p>
                            <a
                                href="/auth"
                                className="inline-block bg-gradient-to-r from-[#6B8AFD] to-[#2351E5] hover:scale-105 transition-transform duration-300 ease-in-out text-white font-bold py-4 px-8 rounded-full shadow-lg"
                            >
                                Get started
                            </a>
                        </div>
                    </Fade>
                    <Fade triggerOnce={true} direction="right">
                        <div className="flex justify-center">
                            <img src={bg2} alt="Cloud Security" className="w-full max-w-lg lg:max-w-xl rounded-lg" />
                        </div>
                    </Fade>
                </div>
            </div>

            <section className="py-16 px-4 md:px-8 lg:px-16">
                <div className="max-w-screen-xl mx-auto">
                    <h2 className="text-center text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-12">
                        Key Features
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                        {[{
                            icon: <FaBullseye />, title: "Rapid Compliance Reporting", description: "Generate compliance reports in just 4-5 hours, significantly faster than competitors."
                        }, {
                            icon: <FaCog />, title: "Unlimited Configuration Audits", description: "Conduct unlimited configuration audits without any restrictions, ensuring thorough cloud security checks."
                        }, {
                            icon: <FaCloud />, title: "Multi-Cloud Support", description: "Seamlessly audit AWS, Azure, and Google Cloud configurations for comprehensive security coverage."
                        }, {
                            icon: <FaChartBar />, title: "Automated Remediation & Continuous Monitoring", description: "Identify vulnerabilities and apply automated fixes while ensuring 24/7 security monitoring."
                        }, {
                            icon: <FaFileAlt />, title: "Customizable Reports", description: "Generate tailored compliance reports to meet your specific business and regulatory requirements."
                        }, {
                            icon: <FaMoneyBillAlt />, title: "Cost-Effective Solutions", description: "Enjoy top-tier cloud security features at a competitive price, maximizing value for your business."
                        }].map((feature, index) => (
                            <MagicCard
                                key={index}
                                className="cursor-pointer flex flex-col items-center justify-center text-center p-6 text-2xl font-semibold shadow-lg rounded-lg"
                                gradientColor={theme === "dark" ? "#262626" : "#D9D9D955"}
                            >
                                <div className="flex items-center justify-center text-6xl mb-4 text-blue-600 dark:text-blue-400">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                                <p className="text-base text-gray-700 dark:text-gray-300">{feature.description}</p>
                            </MagicCard>
                        ))}
                    </div>
                </div>
            </section>
            <hr className="my-6 border-blueGray-300" />
            <Footer />
        </>
    );
};

export default Landing;
