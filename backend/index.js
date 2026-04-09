
import app from './app.js'
import { connectToDatabase } from './db/connections.js'

const PORT = process.env.PORT || 8000
const HOST = process.env.HOST || '0.0.0.0'

connectToDatabase()
  .then(() => {
    app.listen(PORT, HOST, () => console.log(`server started on port ${PORT}`))
  })
  .catch((err) => console.log(err))
