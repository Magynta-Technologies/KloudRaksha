import { useEffect } from "react";
import api from "@/lib/api";

const useLogoutOnTabClose = () => {
  useEffect(() => {
    const handleBeforeUnload = async (event: BeforeUnloadEvent) => {
      await api.get('/user/logout');

      const confirmationMessage = 'Are you sure you want to leave? Your session will be logged out.';
      event.returnValue = confirmationMessage; // Gecko, Trident, Chrome 34+
      return confirmationMessage; // Gecko, WebKit, Chrome <34
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
  //done with hello
};

export default useLogoutOnTabClose;
