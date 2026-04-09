
//@ts-nocheck
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';
import { useState } from 'react';

// Define the plan mapping
const planMapping:any = {
  'plan_OKfOBjZs03DMuV': 'Essential',
  'plan_OKfOewHIlZ5WjW': 'Advanced',
  'plan_OKfOzdYMTZffNP': 'Enterprise',
  'plan_OKfPFM8Omu1huB': 'FLEXI',
};

const UserProfile = () => {
  const auth = useAuth();
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  // Get the plan name based on the plan ID
  const getPlanName = (planId:any) => {
    return planMapping[planId] || 'Unknown Plan'; // Default to 'Unknown Plan' if the planId is not found in the mapping
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-8">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6 bg-gray-100">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Hello, {auth?.user?.name}</h2>
            <table className="min-w-full bg-white">
              <tbody>
                <tr>
                  <td className="py-2 px-4 border-b border-gray-200">Name</td>
                  <td className="py-2 px-4 border-b border-gray-200">{auth?.user?.name}</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 border-b border-gray-200">Email</td>
                  <td className="py-2 px-4 border-b border-gray-200">{auth?.user?.email}</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 border-b border-gray-200">Role</td>
                  <td className="py-2 px-4 border-b border-gray-200">{auth?.user?.role}</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 border-b border-gray-200">Subscription Plan</td>
                  <td className="py-2 px-4 border-b border-gray-200">
                    {getPlanName(auth?.user?.subscription?.planId)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-4 border-b border-gray-200">Subscription Status</td>
                  <td className="py-2 px-4 border-b border-gray-200">{auth?.user?.subscription?.status}</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 border-b border-gray-200">Subscription Amount</td>
                  <td className="py-2 px-4 border-b border-gray-200">${auth?.user?.subscription?.amount}</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 border-b border-gray-200">Subscription ID</td>
                  <td className="py-2 px-4 border-b border-gray-200">{auth?.user?.subscription?.subscriptionId}</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 border-b border-gray-200">Current Period Start</td>
                  <td className="py-2 px-4 border-b border-gray-200">
                    {auth?.user?.subscription?.current_period_start?.toString()}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-4 border-b border-gray-200">Current Period End</td>
                  <td className="py-2 px-4 border-b border-gray-200">
                    {auth?.user?.subscription?.current_period_end?.toString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default UserProfile;
