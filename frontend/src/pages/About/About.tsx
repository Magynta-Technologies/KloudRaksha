import Navbar from "@/components/Navbar/Navbar";
import { FaCloud, FaRocket, FaHandshake } from "react-icons/fa";
import Footer from "@/components/Footer/Footer";
import {Fade,Slide} from 'react-awesome-reveal'

const About = () => {
    return (
        <div>
            <Navbar />
            
            <main className="container mx-auto px-4 py-8 lg:px-20">
                <section className="flex flex-col lg:flex-row lg:space-x-16 items-center">
                    <div className="w-full lg:w-1/2 mb-8 lg:mb-0">
                    <Fade triggerOnce={true}>
                        <img
                            src="https://ramantivirus.com/wp-content/uploads/2023/07/cloud-security.jpg"
                            alt="Cloud Security Image"
                            className="rounded-lg shadow-md"
                        />
                    </Fade>
                    </div>
                    <div className="w-full lg:w-1/2 flex flex-col justify-center">
                        <Slide direction="right" triggerOnce={true}>
                        <h2 className="text-2xl lg:text-3xl font-bold mb-4">Our Mission</h2>
                        <p className="text-gray-700 leading-relaxed">
                            At Kloudraksha, we're on a mission to redefine the
                            way businesses approach cloud configuration audits.
                            With a team of passionate experts in cloud security
                            and compliance, we strive to empower organizations
                            of all sizes to harness the full potential of their
                            cloud environments without compromising on security
                            or compliance.
                        </p>
                        </Slide>
                    </div>
                </section>

                <section className="mt-8 lg:mt-12 flex flex-col lg:flex-row lg:space-x-16 items-center">
                    <div className="w-full lg:w-1/2 mb-8 lg:mb-0">
                        <Fade triggerOnce={true} >
                        <img
                            src="https://t4.ftcdn.net/jpg/02/95/35/59/360_F_295355946_B9tCa67NAgwDRkVT0vD2UNykX0n1v85x.jpg"
                            alt="Cloud Compliance Image"
                            className="rounded-lg shadow-md"
                        />
                        </Fade>
                    </div>
                    <div className="w-full lg:w-1/2 flex flex-col justify-center">
                        <Slide direction="right" triggerOnce={true}>
                        <h2 className="text-2xl lg:text-3xl font-bold mb-4">
                            Empowering Your Business
                        </h2>
                        <p className="text-gray-700 leading-relaxed">
                            With Kloudraksha, we aim to empower businesses to
                            navigate the complexities of cloud configuration
                            with ease, confidence, and efficiency. Join us on
                            our mission to revolutionize cloud compliance and
                            unlock new possibilities for your organization.
                        </p>
                        </Slide>
                    </div>
                </section>

                <section className="mt-8 lg:mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="bg-white rounded-lg p-6 flex flex-col items-center justify-center text-center shadow-md">
                        <Slide triggerOnce={true} direction="right">
                        <FaCloud className="text-4xl text-blue-500 mb-2 lg:mb-4" />
                        <h3 className="text-lg lg:text-xl font-semibold mb-2">
                            Cloud Security
                        </h3>
                        <p className="text-gray-700">
                            Ensuring your data stays safe and secure in the
                            cloud.
                        </p>
                        </Slide>
                    </div>
                    <div className="bg-white rounded-lg p-6 flex flex-col items-center justify-center text-center shadow-md">
                    <Slide triggerOnce={true} direction="right">
                        <FaRocket className="text-4xl text-blue-500 mb-2 lg:mb-4" />
                        <h3 className="text-lg lg:text-xl font-semibold mb-2">
                            Innovation
                        </h3>
                        <p className="text-gray-700">
                            Continuous improvement and pioneering new solutions.
                        </p>
                        </Slide>
                    </div>
                    <div className="bg-white rounded-lg p-6 flex flex-col items-center justify-center text-center shadow-md">
                    <Slide triggerOnce={true} direction="right">
                        <FaHandshake className="text-4xl text-blue-500 mb-2 lg:mb-4" />
                        <h3 className="text-lg lg:text-xl font-semibold mb-2">
                            Collaboration
                        </h3>
                        <p className="text-gray-700">
                            Working together to achieve common goals.
                        </p>
                        </Slide>
                    </div>
                </section>
                
            </main>
            
            
            <Footer/>
        </div>
    );
};

export default About;
