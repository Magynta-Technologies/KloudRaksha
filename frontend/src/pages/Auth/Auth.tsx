import Login from '@/components/Login/Login'
import Register from '@/components/Register/Register'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"


function Auth() {
  return (
    <div className='flex h-screen items-center'>
      <div className='w-1/2 object-center'>
        <img className='object-cover text-center' src="/Final.png" alt="placeholder 3d render image" />
      </div>
      <div className='w-1/2 grid place-content-center'>
        <Tabs defaultValue="signup" className="w-[500px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
            <TabsTrigger value="login">Login</TabsTrigger>
          </TabsList>
          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Sign Up</CardTitle>
                <CardDescription className='w-full'>
                  Create your KloudRaksha account and get started
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Register/>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription className='w-full'>
                  Head toward your dashboard by entering your login credentials
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Login/>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
   
  )
}

export default Auth