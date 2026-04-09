import { useAuth } from "@/context/AuthContext";
import { PropsWithChildren, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ProtectedRouteSuperAdmin = ({ children }: PropsWithChildren) => {
    const auth = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (auth?.user?.role !== "superadmin") {
            navigate("/", { replace: true });
        }
    }, [navigate, auth]);

    return <>{children}</>;
};

export default ProtectedRouteSuperAdmin;
