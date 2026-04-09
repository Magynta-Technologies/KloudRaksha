import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, User, Mail, Calendar, Activity, Shield } from 'lucide-react'

interface UserProfileProps {
  userId: string
  onBack: () => void
}

const mockUserData = {
  id: '1',
  name: 'Alice Johnson',
  email: 'alice@example.com',
  role: 'Administrator',
  status: 'Active',
  lastLogin: '2024-11-24',
  activity: 'High',
}

const mockAuditHistory = [
  { id: 1, date: '2024-11-20', type: 'System Check', status: 'Passed', report: '/audit1.pdf' },
  { id: 2, date: '2024-11-15', type: 'Security Scan', status: 'Failed', report: '/audit2.pdf' },
  { id: 3, date: '2024-11-10', type: 'Data Integrity', status: 'Passed', report: '/audit3.pdf' },
]
//@ts-ignore
export default function UserProfile({ userId, onBack }: UserProfileProps) {
  const user = mockUserData

  const handleDownloadReport = (reportUrl: string) => {
    window.open(reportUrl, '_blank')
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">User Profile: {user.name}</h2>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to User List
        </Button>
      </div>

      {/* General Info and Action Buttons Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* General Information */}
        <Card>
          <CardHeader>
            <CardTitle>General Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div className="flex items-center justify-between">
                <dt className="flex items-center font-semibold">
                  <User className="mr-2 h-4 w-4" /> Name:
                </dt>
                <dd>{user.name}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center font-semibold">
                  <Mail className="mr-2 h-4 w-4" /> Email:
                </dt>
                <dd>{user.email}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center font-semibold">
                  <Shield className="mr-2 h-4 w-4" /> Role:
                </dt>
                <dd>{user.role}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center font-semibold">
                  <Activity className="mr-2 h-4 w-4" /> Status:
                </dt>
                <dd>{user.status}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center font-semibold">
                  <Calendar className="mr-2 h-4 w-4" /> Last Login:
                </dt>
                <dd>{user.lastLogin}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center font-semibold">
                  <Activity className="mr-2 h-4 w-4" /> Activity:
                </dt>
                <dd>{user.activity}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              
              <Button variant="outline" className="w-full">
                Activate User
              </Button>
              <Button variant="destructive" className="w-full">
                Deactivate User
              </Button>
              <Button variant="outline" className="w-full">
                Reset Password
              </Button>
              <Button variant="outline" className="w-full">
                Assign Role
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit History Section */}
      <Card>
        <CardHeader>
          <CardTitle>Audit History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockAuditHistory.map((audit) => (
                <TableRow key={audit.id}>
                  <TableCell>{audit.date}</TableCell>
                  <TableCell>{audit.type}</TableCell>
                  <TableCell>{audit.status}</TableCell>
                  <TableCell>
                    <Button
                      onClick={() => handleDownloadReport(audit.report)}
                      size="sm"
                      variant="outline"
                    >
                      Download Report
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}