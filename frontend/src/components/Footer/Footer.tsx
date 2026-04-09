import { FaRegEnvelope, FaLinkedin } from "react-icons/fa";
import logo from "../../images/KR_Final_2.png";
import { Link } from "react-router-dom";

const Footer = () => {
    return (
        <footer className="relative bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-300 pt-12 pb-6 transition-colors duration-300">
            <div className="container mx-auto px-6 lg:px-12">
                <div className="flex flex-wrap justify-between">
                    {/* Left Section */}
                    <div className="w-full lg:w-5/12 px-4">
                        <img src={logo} className="h-16 mb-4 dark:brightness-200" alt="logo" />
                        <h4 className="text-2xl font-semibold">Stay Connected!</h4>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            Reach out to us on any platform. We usually respond within 1-2 business days.
                        </p>
                        <div className="mt-6 flex space-x-4">
                            <a 
                                href="https://www.linkedin.com/company/newton-s-apple/" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="bg-gray-200 dark:bg-gray-700 hover:bg-blue-500 dark:hover:bg-blue-400 p-3 rounded-full transition duration-300"
                            >
                                <FaLinkedin className="text-xl text-gray-700 dark:text-gray-300 hover:text-white" />
                            </a>
                            <a 
                                href="mailto:connect@newtonsapple.in"
                                className="bg-white dark:bg-gray-700 hover:bg-red-500 dark:hover:bg-red-400 p-3 rounded-full transition duration-300"
                            >
                                <FaRegEnvelope className="text-xl text-gray-700 dark:text-gray-300 hover:text-white" />
                            </a>
                        </div>
                    </div>

                    {/* Right Section - Useful Links */}
                    <div className="w-full lg:w-5/12 px-4 mt-8 lg:mt-0">
                        <h5 className="text-lg font-semibold">Useful Links</h5>
                        <ul className="space-y-2">
                            <li>
                                <Link 
                                    to="/" 
                                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition duration-300"
                                >
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link 
                                    to="/about" 
                                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition duration-300"
                                >
                                    About
                                </Link>
                            </li>
                            <li>
                                <Link 
                                    to="/plans" 
                                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition duration-300"
                                >
                                    Plans
                                </Link>
                            </li>
                            <li>
                                <Link 
                                    to="/help" 
                                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition duration-300"
                                >
                                    Help
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <hr className="my-6 border-gray-300 dark:border-gray-700" />

                {/* Footer Bottom */}
                <div className="text-center text-gray-600 dark:text-gray-400 text-sm">
                    <p>© 2024 Developed & Secured by Newtons Apple Security Solutions</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
