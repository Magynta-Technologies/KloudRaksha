import { useAuth } from "@/context/AuthContext";
import { PropsWithChildren, useEffect } from "react"
import { useNavigate } from "react-router-dom";

const ProtectedRouteAdmin = ({ children } : PropsWithChildren) => {
    const auth = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if(auth?.user?.role !== 'admin'){
            navigate('/', { replace: true });
        }
    }, [navigate, auth]);

    return <>{children}</>;
}

export default ProtectedRouteAdmin;