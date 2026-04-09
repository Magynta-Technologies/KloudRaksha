import React from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';
import { Fade, Slide } from 'react-awesome-reveal';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { useNavigate } from 'react-router-dom';

const handlePayment = async (planId: string, navigate: any) => {
    try {
      const response = await api.post('/payment/order', { planId });
  
      const { id: subscriptionId } = response.data;
  
      const options = {
        key: "rzp_test_WthU3JJ2asFE9Z",
        subscription_id: subscriptionId,
        name: 'Raksha',
        description: 'Subscription Payment',
        handler: async (response: { razorpay_payment_id: string; razorpay_subscription_id: string; razorpay_signature: string; }) => {
          const data = {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_subscription_id: response.razorpay_subscription_id,
            razorpay_signature: response.razorpay_signature,
            subscription: {
              status: 'active', // Adjust according to actual subscription status received from Razorpay
              current_start: new Date().toISOString(),
              current_end: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString() // Assuming a 1-year subscription
            }
          };
  
          try {
            await verifyPayment(data, navigate);
          } catch (verifyError) {
            console.error('Payment Verification Error:', verifyError);
            alert('Payment Verification Failed');
          }
        },
        theme: {
          color: '#3399cc'
        }
      };
  
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Payment Error:', error);
      alert('Payment Failed');
    }
  };
  
  const verifyPayment = async (data: { razorpay_payment_id: string; razorpay_subscription_id: string; razorpay_signature: string; subscription: any; }, navigate: any) => {
    try {
      const response = await api.post('/payment/verify', data);
      if (response.data.status === 'ok') {
        alert("Payment Successful")
        navigate('/dashboard');
      } else {
        throw new Error('Verification failed');
      }
    } catch (error) {
      console.error('Payment Verification Error:', error);
      alert('Payment Verification Failed');
    }
  };
  
const Plans: React.FC = () => {
    const navigate = useNavigate();

  return (
    <div className="min-h-screen">
    <Navbar />
    <section className="bg-white dark:bg-gray-900">
        <div className="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6">
            <div className="mx-auto max-w-screen-md text-center mb-8 lg:mb-12">
                <Slide triggerOnce={true} direction="right">
                    <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white">
                        Designed for business teams like yours
                    </h2>
                </Slide>
                <Slide triggerOnce={true} direction="right">
                    <p className="mb-5 font-light text-gray-500 sm:text-xl dark:text-gray-400">
                        Select the plan that aligns perfectly with your
                        requirements, or contact us for a personalized
                        Enterprise solution tailored to your organization's
                        unique needs. Unlock the flexibility and power of
                        Kloudraksha today!
                    </p>
                </Slide>
            </div>

            <div className="space-y-8 lg:grid lg:grid-cols-4 sm:gap-6 xl:gap-10 lg:space-y-0">
                <Fade triggerOnce={true}>
                    <div className="flex flex-col p-6 mx-auto max-w-lg text-center text-gray-900 bg-white rounded-lg border border-gray-100 shadow dark:border-gray-600 xl:p-8 dark:bg-gray-800 dark:text-white">
                        <h3 className="mb-4 text-2xl font-semibold">
                            Essential
                        </h3>
                        <p className="font-light text-gray-500 sm:text-lg dark:text-gray-400">
                            Best option for personal use & for your next
                            project.
                        </p>
                        <div className="flex justify-center items-baseline my-8">
                            <span className="mr-2 text-5xl font-extrabold">
                                $199
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">
                                /month
                            </span>
                        </div>

                        <ul
                            role="list"
                            className="mb-8 space-y-4 text-left"
                        >
                            <li className="flex items-center space-x-3">
                                <FaTimes color="red" />
                                <span>Compliance Reporting</span>
                            </li>
                            <li className="flex items-center space-x-3">
                                <FaCheck color="green" />
                                <span>
                                    Configuration Audits:12 audits/year
                                </span>
                            </li>
                            <li className="flex items-center space-x-3">
                                <FaCheck color="green" size={12} />
                                <span>Multi-Cloud Support:M365</span>
                            </li>
                            <li className="flex items-center space-x-3">
                                <FaTimes color="red" />
                                <span>Remediation Support</span>
                            </li>
                            <li className="flex items-center space-x-3">
                                <FaTimes color="red" />
                                <span>Customized Reports</span>
                            </li>
                            <li className="flex items-center space-x-3">
                                <FaTimes color="red" />
                                <span>Free On-call Support</span>
                            </li>
                            <li className="flex items-center space-x-3">
                                <FaCheck color="green" size={20} />
                                <span>
                                    Priority Support: Basic (2 business
                                    days)
                                </span>
                            </li>
                            <li className="flex items-center space-x-3">
                                <FaCheck color="green" size={15} />
                                <span>Report Delivery:Within 24 hrs</span>
                            </li>
                        </ul>
                         <Button
                            onClick={() => handlePayment("plan_OZbAvw0THX4BAl",navigate)}
                            className="text-white bg-[#2351E5] hover:bg-primary-700 focus:ring-4 focus:ring-primary-200 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-cyan-400"
                        >
                            Buy
                        </Button>
                      
                    </div>
                </Fade>
                <Fade triggerOnce={true}>
                    <div className="flex flex-col p-6 mx-auto max-w-lg text-center text-gray-900 bg-white rounded-lg border border-gray-100 shadow dark:border-gray-600 xl:p-8 dark:bg-gray-800 dark:text-white">
                        <h3 className="mb-4 text-2xl font-semibold">
                            Advanced
                        </h3>
                        <p className="font-light text-gray-500 sm:text-lg dark:text-gray-400">
                            Relevant for multiple users, extended & premium
                            support.
                        </p>
                        <div className="flex justify-center items-baseline my-8">
                            <span className="mr-2 text-5xl font-extrabold">
                                $999
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">
                                /month
                            </span>
                        </div>

                        <ul
                            role="list"
                            className="mb-8 space-y-4 text-left"
                        >
                            <li className="flex items-center space-x-3">
                                <FaCheck size={20} color="green" />
                                <span>Compliance Reporting</span>
                            </li>
                            <li className="flex items-center space-x-3">
                                <FaCheck size={20} color="green" />
                                <span>
                                    Configuration Audits:36 audits/year
                                </span>
                            </li>
                            <li className="flex items-center space-x-3">
                                <FaCheck size={20} color="green" />
                                <span>Multi-Cloud Support:M365, AWS</span>
                            </li>
                            <li className="flex items-center space-x-3">
                                <FaCheck size={20} color="green" />
                                <span>Remediation Support</span>
                            </li>
                            <li className="flex items-center space-x-3">
                                <FaCheck size={20} color="green" />
                                <span>Customized Reports</span>
                            </li>
                            <li className="flex items-center space-x-3">
                                <FaCheck size={20} color="green" />
                                <span>
                                    Free On-call Support
                                </span>
                            </li>
                            <li className="flex items-center space-x-3">
                                <FaCheck size={20} color="green" />
                                <span>
                                    Priority Support: Priority (8 hrs)
                                </span>
                            </li>
                            <li className="flex items-center space-x-3">
                                <FaCheck size={20} color="green" />
                                <span>Report Delivery:Within 4 hrs</span>
                            </li>
                        </ul>
                        <Button
                            className="text-white bg-[#2351E5] hover:bg-primary-700 focus:ring-4 focus:ring-primary-200 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-cyan-400"
                            onClick={() => handlePayment("plan_OZbBPUjtFaJr6m",navigate)}
                        >
                            Buy
                        </Button>
                    </div>
                </Fade>
                <Fade triggerOnce={true}>
                    <div className="flex flex-col p-6 mx-auto max-w-lg text-center text-gray-900 bg-white rounded-lg border border-gray-100 shadow dark:border-gray-600 xl:p-8 dark:bg-gray-800 dark:text-white">
                        <h3 className="mb-4 text-2xl font-semibold">
                            Enterprise
                        </h3>
                        <p className="font-light text-gray-500 sm:text-lg dark:text-gray-400">
                            Best for large scale uses and extended
                            redistribution rights.
                        </p>
                        <div className="flex justify-center items-baseline my-8">
                            <span className="mr-2 text-5xl font-extrabold">
                                $1999
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">
                                /month
                            </span>
                        </div>

                        <ul
                            role="list"
                            className="mb-8 space-y-4 text-left"
                        >
                            <li className="flex items-center space-x-3">
                                <FaCheck size={20} color="green" />
                                <span>Compliance Reporting</span>
                            </li>
                            <li className="flex items-center space-x-3">
                                <FaCheck size={20} color="green" />
                                <span>Configuration Audits:Unlimited</span>
                            </li>
                            <li className="flex items-center space-x-3">
                                <FaCheck size={20} color="green" />
                                <span>
                                    Multi-Cloud Support:AWS,Azure,M365
                                </span>
                            </li>
                            <li className="flex items-center space-x-3">
                                <FaCheck size={20} color="green" />
                                <span>Remediation Support</span>
                            </li>
                            <li className="flex items-center space-x-3">
                                <FaCheck size={20} color="green" />
                                <span>Customized Reports</span>
                            </li>
                            <li className="flex items-center space-x-3">
                                <FaCheck size={20} color="green" />
                                <span>Free On-call Support</span>
                            </li>
                            <li className="flex items-center space-x-3">
                                <FaCheck size={20} color="green" />
                                <span>Priority Support: VIP (30 mins)</span>
                            </li>
                            <li className="flex items-center space-x-3">
                                <FaCheck size={20} color="green" />
                                <span>Report Delivery:Within 30 mins</span>
                            </li>
                        </ul>
                        <Button
                          onClick={() => handlePayment("plan_OZbkGnKJSTyoc6",navigate)}
                            className="text-white bg-[#2351E5] hover:bg-primary-700 focus:ring-4 focus:ring-primary-200 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-cyan-400"
                        >
                            Buy
                        </Button>
                    </div>
                </Fade>
                <Fade triggerOnce={true}>
                    <div className="flex flex-col p-6 mx-auto max-w-lg text-center text-gray-900 bg-white rounded-lg border border-gray-100 shadow dark:border-gray-600 xl:p-8 dark:bg-gray-800 dark:text-white">
                        <h3 className="mb-4 text-2xl font-semibold">
                            FLEXI
                        </h3>
                        <p className="font-light text-gray-500 sm:text-lg dark:text-gray-400">
                            Best for large scale uses and extended
                            redistribution rights.
                        </p>
                        <div className="flex justify-center items-baseline my-8">
                            <span className="mr-2 text-5xl font-extrabold">
                                $199
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">
                                /month
                            </span>
                        </div>

                        <ul
                            role="list"
                            className="mb-8 space-y-4 text-left"
                        >
                            <li className="flex items-center space-x-3">
                                <FaCheck size={20} color="green" />
                                <span>Compliance Reporting</span>
                            </li>
                            <li className="flex items-center space-x-3">
                                <FaCheck size={20} color="green" />
                                <span>Configuration Audits:1</span>
                            </li>
                            <li className="flex items-center space-x-3">
                                <FaCheck size={20} color="green" />
                                <span>Multi-Cloud Support:All</span>
                            </li>
                            <li className="flex items-center space-x-3">
                                <FaTimes size={20} color="red" />
                                <span>Remediation Support</span>
                            </li>
                            <li className="flex items-center space-x-3">
                                <FaTimes size={20} color="red" />
                                <span>Customized Reports</span>
                            </li>
                            <li className="flex items-center space-x-3">
                                <FaCheck size={20} color="green" />
                                <span>
                                    Free On-call Support:Mon-Fri 10 am – 5
                                    pm IST
                                </span>
                            </li>
                            <li className="flex items-center space-x-3">
                                <FaCheck size={20} color="green" />
                                <span>
                                    Priority Support: Priority (8 hrs)
                                </span>
                            </li>
                            <li className="flex items-center space-x-3">
                                <FaCheck size={20} color="green" />
                                <span>Report Delivery:Within 4 hrs</span>
                            </li>
                        </ul>
                        <Button
                            onClick={() => handlePayment("plan_OZbkcByMzhFfMg",navigate)}
                            className="text-white bg-[#2351E5] hover:bg-primary-700 focus:ring-4 focus:ring-primary-200 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-cyan-400"
                        >
                            Buy
                        </Button>
                    </div>
                </Fade>
            </div>
        </div>
    </section>
    <Footer />
</div>
  );
};

export default Plans;
