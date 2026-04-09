import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import PasswordStrengthIndicator from "./PasswordStrengthIndicator"; // Import the new component

const emailValidation = z
  .string()
  .email({ message: "Invalid email address." })
  .refine(
    (email) => {
      const forbiddenDomains = ["@gmail.com", "@yahoo.com"];
      if (forbiddenDomains.some((domain) => email.endsWith(domain))) {
        return false;
      }

      const [username] = email.split("@");
      if (/^\d+$/.test(username)) {
        return false;
      }

      return true;
    },
    {
      message:
        "Email should not contain @gmail.com or @yahoo.com and must not be only numbers before @.",
    }
  );

const passwordValidation = z
  .string()
  .min(6, { message: "Password must be at least 6 characters." })
  .refine((password) => /[A-Z]/.test(password), {
    message: "Password must contain at least one uppercase letter.",
  })
  .refine((password) => /[a-z]/.test(password), {
    message: "Password must contain at least one lowercase letter.",
  })
  .refine((password) => /\d/.test(password), {
    message: "Password must contain at least one number.",
  })
  .refine((password) => /[\W_]/.test(password), {
    message: "Password must contain at least one special character.",
  });

const formSchema = z.object({
  email: emailValidation,
  password: passwordValidation,
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
});

function Register() {
  const auth = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const { email, password, name } = values;

    try {
      await auth?.signup(name, email, password);
      toast({
        title: `Logged in as ${name}`,
      });
      setIsLoading(false);
    } catch (error) {
      console.log(error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem with your request.",
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (auth?.user) {
      setTimeout(() => {
        toast({
          title: `Logged in as ${auth?.user?.name}`,
        });
      }, 500);
      switch (auth?.user?.role) {
        case "user":
          navigate("/user");
          break;
        case "admin":
          navigate("/admin");
          break;
        case "superadmin":
          navigate("/superadmin");
          break;
        default:
          break;
      }
    }
  }, [auth]);

  return (
    <div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full space-y-6"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="name" autoComplete="off" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="Email" autoComplete="off" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="password"
                    autoComplete="off"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      setPassword(e.target.value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <PasswordStrengthIndicator password={password} />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}{" "}
            Sign Up
          </Button>
        </form>
      </Form>
    </div>
  );
}

export default Register;
