import React from "react";
import { FiMapPin, FiPhone, FiMail } from "react-icons/fi"; // Importing necessary icons
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import {Slide,Fade} from "react-awesome-reveal"

const ContactPage: React.FC = () => {
    return (
        <div>
            <Navbar />
            <section className="bg-white dark:bg-slate-800" id="contact">
                <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
                    <div className="mb-4">
                        <div className="mb-6 max-w-3xl text-center sm:text-center md:mx-auto md:mb-12">
                            <Slide triggerOnce={true} direction="right">
                            <h2 className="font-heading mb-4 font-bold tracking-tight text-gray-900 dark:text-white text-3xl sm:text-5xl">
                                Get in touch
                            </h2>
                            </Slide>
                            {/*<p className="mx-auto mt-4 max-w-3xl text-xl text-gray-600 dark:text-slate-400">
                                In hac habitasse platea dictumst
                            </p> */}
                        </div>
                    </div>
                    <div className="flex items-stretch justify-center">
                        <div className="grid md:grid-cols-2">
                            <div className="h-full pr-6">
                                <Fade triggerOnce={true}>
                                <p className="mt-3 mb-12 text-lg text-gray-600 dark:text-slate-400">
                                 Alternatively,kindly call on the phone number provided below for further support. Currently, we provide support from Monday to Friday.
                                </p>
                                </Fade>
                                <ul className="mb-6 md:mb-0">
                                    <Fade triggerOnce={true}>
                                    <li className="flex">
                                        <div className="flex h-10 w-10 items-center justify-center rounded bg-blue-900 text-gray-50">
                                            <FiMapPin size={24} color="#2351E" /> {/* Replace SVG with React Icon */}
                                        </div>
                                        <div className="ml-4 mb-4">
                                            <h3 className="mb-2 text-lg font-medium leading-6 text-gray-900 dark:text-white">
                                            Address
                                            </h3>
                                            <p className="text-gray-600 dark:text-slate-400">
                                         Anjali Apartment Flat No 2, Ground Floor, SR. NO. 80/18/2, Near Sakal Nagar, Baner Road, Aundh Pune - 411007.
                                            </p>
                                        </div>
                                    </li>
                                    </Fade>
                                    <Fade triggerOnce={true}>
                                    <li className="flex">
                                        <div className="flex h-10 w-10 items-center justify-center rounded bg-blue-900 text-gray-50">
                                            <FiPhone size={24} color="#2351E" /> {/* Replace SVG with React Icon */}
                                        </div>
                                        <div className="ml-4 mb-4">
                                            <h3 className="mb-2 text-lg font-medium leading-6 text-gray-900 dark:text-white">
                                                Contact
                                            </h3>
                                            <p className="text-gray-600 dark:text-slate-400">
                                                Mobile: +91 82083 087709
                                            </p>
                                        </div>
                                    </li>
                                    </Fade>
                                    <Fade triggerOnce={true}>
                                    <li className="flex">
                                        <div className="flex h-10 w-10 items-center justify-center rounded bg-blue-900 text-gray-50">
                                            <FiMail size={24} color="#2351E" /> {/* Replace SVG with React Icon */}
                                        </div>
                                        <div className="ml-4 mb-4">
                                            <h3 className="mb-2 text-lg font-medium leading-6 text-gray-900 dark:text-white">
                                                E-Mail
                                            </h3>
                                            <p className="text-gray-600 dark:text-slate-400">
                                                <a href="mailto:info@kloudraksha.com">Mail: connect@vulnuris.com</a>
                                            </p>
                                        </div>
                                    </li>
                                    </Fade>
                                    
                                </ul>
                            </div>
                            <Fade triggerOnce={true}>
                            <div
                                className="card h-fit max-w-6xl p-5 md:p-12"
                                id="form"
                            >
                                {/*<h2 className="mb-4 text-2xl font-bold text-center">
                                    Ready to Get Started?
                        </h2>*/}
                                <form id="contactForm">
                                    <div className="mb-6">
                                        <div className="mx-0 mb-1 sm:mb-4">
                                            <div className="mx-0 mb-1 sm:mb-4">
                                                <label
                                                    htmlFor="name"
                                                    className="pb-1 text-xs uppercase tracking-wider font-bold"
                                                >
                                                    Name
                                                </label>
                                                <input
                                                    type="text"
                                                    id="name"
                                                    placeholder="Your name"
                                                    className="mb-2 w-full rounded-md border border-gray-400 py-2 pl-2 pr-4 shadow-md dark:text-gray-300 sm:mb-0 text-center"
                                                    name="name"
                                                />
                                            </div>
                                            <div className="mx-0 mb-1 sm:mb-4">
                                                <label
                                                    htmlFor="email"
                                                    className="pb-1 text-xs uppercase tracking-wider font-bold"
                                                >
                                                    Email
                                                </label>
                                                <input
                                                    type="email"
                                                    id="email"
                                                    placeholder="Your email address"
                                                    className="mb-2 w-full rounded-md border border-gray-400 py-2 pl-2 pr-4 shadow-md dark:text-gray-300 sm:mb-0 text-center"
                                                    name="email"
                                                />
                                            </div>
                                        </div>
                                        <div className="mx-0 mb-1 sm:mb-4">
                                            <label
                                                htmlFor="textarea"
                                                className="pb-1 text-xs uppercase tracking-wider font-bold"
                                            >
                                                Message
                                            </label>
                                            <textarea
                                                id="textarea"
                                                name="textarea"
                                                placeholder="Write your message..."
                                                className="mb-2 w-full rounded-md border border-gray-400 py-2 pl-2 pr-4 shadow-md dark:text-gray-300 sm:mb-0 text-center"
                                            ></textarea>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <button
                                            type="submit"
                                            className="w-full bg-blue-800 text-white px-6 py-3 font-xl rounded-md sm:mb-0" // Change button color
                                        >
                                            Send Message
                                        </button>
                                    </div>
                                </form>
                            </div>
                            </Fade>
                        </div>
                    </div>
                </div>
            </section>
            <Footer />
        </div>
    );
};

export default ContactPage;
