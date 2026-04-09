//@ts-nocheck

import React, { useState, FormEvent, ChangeEvent, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import api from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FaAws } from "react-icons/fa";
import { VscAzure } from "react-icons/vsc";
import { SiGooglecloud } from "react-icons/si";

interface PersonalFormData {
  name: string;
  email: string;
  purpose: string;
  provider: string;
  officeEmail: string;
}

interface AWSFormData {
  awsSecretKey: string;
  awsSecretPassword: string;
}

interface AzureFormData {
  azureClientId: string;
  azureClientSecret: string;
  azureTenantId: string;
}

interface GCPFormData {
  gcpClientId: string;
  gcpClientSecret: string;
  gcpTenantId: string;
}

type CloudFormData = AWSFormData | AzureFormData | GCPFormData;

const TypeWriter = ({
  text,
  icon,
}: {
  text: string;
  icon?: React.ReactNode;
}) => {
  const [displayText, setDisplayText] = useState("");
  const [showIcon, setShowIcon] = useState(false);

  useEffect(() => {
    if (!text) return;
    if (text === displayText) return;

    let index = 0;
    const timer = setInterval(() => {
      if (index <= text.length) {
        setDisplayText(text.slice(0, index));
        index++;
      } else {
        clearInterval(timer);
        if (icon) {
          setTimeout(() => {
            setShowIcon(true);
          }, 200);
        }
      }
    }, 50);

    return () => clearInterval(timer);
  }, [icon, text]);

  return (
    <span className="flex items-center justify-center">
      <span
        className={`text-2xl transition-opacity duration-500 ${
          showIcon ? "opacity-100" : "opacity-0"
        }`}
      >
        {icon}
      </span>
      <span className="ml-2">{displayText}</span>
    </span>
  );
};

export default function NewScan() {
  const [step, setStep] = useState<1 | 2>(1);
  const [isPersonalFormCompleted, setIsPersonalFormCompleted] = useState(false);
  const [formData, setFormData] = useState<
    PersonalFormData & Partial<CloudFormData>
  >({
    name: "",
    email: "",
    purpose: "",
    provider: "",
    officeEmail: "",
  });
  const [provider, setProvider] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const submittingRef = useRef(false);

  const handlePersonalChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    console.log(`Field ${name} changed to:`, value);
    setFormData((prev: PersonalFormData & Partial<CloudFormData>) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProviderChange = (value: string) => {
    setFormData((prev: PersonalFormData & Partial<CloudFormData>) => ({
      ...prev,
      provider: value,
      awsSecretKey: undefined,
      awsSecretPassword: undefined,
      azureClientId: undefined,
      azureClientSecret: undefined,
      azureTenantId: undefined,
      gcpClientId: undefined,
      gcpClientSecret: undefined,
      gcpTenantId: undefined,
    }));
    setProvider(value);
  };

  const hasField = (obj: any, field: string): boolean => {
    return field in obj && typeof obj[field as keyof typeof obj] === "string";
  };

  const handlePersonalSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const requiredFields = [
      "name",
      "email",
      "purpose",
      "provider",
      "officeEmail",
    ];
    const isFormValid = requiredFields.every(
      (field) =>
        hasField(formData, field) &&
        (formData[field as keyof PersonalFormData] as string).trim() !== ""
    );
    if (isFormValid) {
      setIsPersonalFormCompleted(true);
      setStep(2);
    }
  };

  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submittingRef.current) {
      return;
    }
    submittingRef.current = true;
    setLoading(true);
    setError(null);
    setSuccess(false);

    console.log("Current formData state:", formData);

    const filteredFormData = Object.fromEntries(
      Object.entries(formData).filter(([_, value]) => value !== undefined)
    );

    console.log("Form data being sent:", filteredFormData);

    try {
      const response = await api.post("/scan/scanrequest", filteredFormData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200) {
        setSuccess(true);
      } else {
        throw new Error(response.statusText);
      }
    } catch (error) {
      console.error(error);
      setError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="rounded-lg border shadow-sm p-6 bg-card text-card-foreground dark:border-gray-800">
        {/* Segmented Control */}
        <div className="flex mb-8 bg-muted p-1 rounded-md dark:bg-gray-800/50">
          <button
            onClick={() => setStep(1)}
            className={`flex-1 py-2 text-sm font-medium rounded-md
              border border-2 transition-colors ${
              step === 1
                ? "bg-background text-primary shadow-sm dark:bg-gray-900"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Personal Information
          </button>
          <button
            onClick={() => isPersonalFormCompleted && setStep(2)}
            className={`flex-1 py-2 text-sm font-medium rounded-md border border-2 transition-colors ${
              step === 2
                ? "bg-background text-primary shadow-sm dark:bg-gray-900"
                : "text-muted-foreground hover:text-foreground"
            } ${
              !isPersonalFormCompleted ? "cursor-not-allowed opacity-50" : ""
            }`}
            disabled={!isPersonalFormCompleted}
          >
            <TypeWriter
              text={
                provider === "aws"
                  ? "AWS Credentials"
                  : provider === "gcp"
                  ? "GCP Credentials"
                  : provider === "azure"
                  ? "Azure Credentials"
                  : "Credentials"
              }
              icon={
                provider === "aws" ? (
                  <FaAws />
                ) : provider === "gcp" ? (
                  <SiGooglecloud />
                ) : provider === "azure" ? (
                  <VscAzure />
                ) : null
              }
            />
          </button>
        </div>

        {/* Forms */}
        <div className="space-y-6">
          {step === 1 ? (
            <form onSubmit={handlePersonalSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Name</label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handlePersonalChange}
                  className="h-12"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">
                  Email Id
                </label>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handlePersonalChange}
                  className="h-12"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">
                  Office Email Id
                </label>
                <Input
                  name="officeEmail"
                  type="email"
                  value={formData.officeEmail}
                  onChange={handlePersonalChange}
                  className="h-12"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Purpose</label>
                <Input
                  name="purpose"
                  value={formData.purpose}
                  onChange={handlePersonalChange}
                  className="h-12"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">
                  Provider
                </label>
                <Select
                  value={provider}
                  onValueChange={(value) => handleProviderChange(value)}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select Provider" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border dark:border-gray-800">
                    <SelectItem value="aws">AWS</SelectItem>
                    <SelectItem value="gcp">GCP</SelectItem>
                    <SelectItem value="azure">Azure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full h-12 text-sm font-medium">
                Next
              </Button>
            </form>
          ) : (
            <form onSubmit={handleFormSubmit} className="space-y-4">
              {provider === "aws" ? (
                <>
                  <div className="space-y-1">
                    <label className="text-sm text-muted-foreground">
                      AWS Secret Id
                    </label>
                    <Input
                      name="awsSecretKey"
                      value={formData.awsSecretKey || ""}
                      onChange={handlePersonalChange}
                      className="h-12"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-muted-foreground">
                      AWS Secret Password
                    </label>
                    <Input
                      name="awsSecretPassword"
                      type="password"
                      value={formData.awsSecretPassword || ""}
                      onChange={handlePersonalChange}
                      className="h-12"
                      required
                    />
                  </div>
                </>
              ) : provider === "azure" ? (
                <>
                  <div className="space-y-1">
                    <label className="text-sm text-muted-foreground">
                      Client ID
                    </label>
                    <Input
                      name="azureClientId"
                      type="text"
                      value={formData.azureClientId || ""}
                      onChange={handlePersonalChange}
                      className="h-12"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-muted-foreground">
                      Client Secret
                    </label>
                    <Input
                      name="azureClientSecret"
                      type="password"
                      value={formData.azureClientSecret || ""}
                      onChange={handlePersonalChange}
                      className="h-12"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-muted-foreground">
                      Tenant Id
                    </label>
                    <Input
                      name="azureTenantId"
                      type="text"
                      value={formData.azureTenantId || ""}
                      onChange={handlePersonalChange}
                      className="h-12"
                      required
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-sm text-muted-foreground">
                      Client Id
                    </label>
                    <Input
                      name="gcpClientId"
                      type="text"
                      value={formData.gcpClientId || ""}
                      onChange={handlePersonalChange}
                      className="h-12"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-muted-foreground">
                      Client Secret
                    </label>
                    <Input
                      name="gcpClientSecret"
                      type="password"
                      value={formData.gcpClientSecret || ""}
                      onChange={handlePersonalChange}
                      className="h-12"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-muted-foreground">
                      Tenant Id
                    </label>
                    <Input
                      name="gcpTenantId"
                      type="text"
                      value={formData.gcpTenantId || ""}
                      onChange={handlePersonalChange}
                      className="h-12"
                      required
                    />
                  </div>
                </>
              )}
              <Button
                type="submit"
                className="w-full h-12 text-sm font-medium"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Initiating Scan...
                  </>
                ) : (
                  "Initiate Scan"
                )}
              </Button>
            </form>
          )}
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mt-4 dark:border-green-800 dark:bg-green-900/10">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              Scan request initiated successfully!
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
