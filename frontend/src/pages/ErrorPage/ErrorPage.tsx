import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"

function ErrorPage() {
  return (
    <div className='grid place-content-center gap-4 h-screen place-items-center'>
      <h1 className='text-4xl font-semibold tracking-tight'>Oops...</h1>
      <p className='text-xl '>Seems like you are trying to find a page that does not exist</p>
      <Button asChild>
        <Link to='/'>Go Back</Link>
      </Button>
    </div>
  )
}

export default ErrorPage