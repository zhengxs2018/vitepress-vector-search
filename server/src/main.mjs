import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import Router from '@koa/router'

import search from './routes/search.mjs'

const app = new Koa()
const router = new Router()

router.post('/vector-search', search)

app.use(bodyParser())
app.use(router.routes())
app.use(router.allowedMethods())

app.listen(3000, () => {
  console.log('Server listening on port http://localhost:3000')
})
