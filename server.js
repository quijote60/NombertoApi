require('dotenv').config()
const express = require('express')
const app = express()
const path = require('path')
const PORT = process.env.PORT || 3500
const {logger, logEvents} =  require('./middleware/logger')
const cookieParser =  require('cookie-parser')
const cors = require('cors')
const corsOptions = require('./config/corsOptions')
const connectDB = require('./config/dbConn')
const mongoose = require('mongoose')
const errorHandler = require('./middleware/errorHandler')

console.log(process.env.NODE_ENV)

connectDB()

app.use(logger)

app.use(cors(corsOptions))

app.use(express.json())



app.use(cookieParser())

app.use('/', express.static(path.join(__dirname, '/public')))

app.use('/', require('./routes/root'))


//app.use('/auth', require('./routes/authRoutes'))
app.use('/users', require('./routes/userRoutes'))
app.use('/properties', require('./routes/propertiesRoutes'))
app.use('/expensetypes', require('./routes/ExpenseTypesRoutes'))
app.use('/expenses', require('./routes/ExpensesRoutes'))
app.use('/finetypes', require('./routes/FineTypesRoutes'))
app.use('/fines', require('./routes/FinesRoutes'))
app.use('/inspectiontypes', require('./routes/InspectionTypesRoutes'))
app.use('/inspections', require('./routes/InspectionsRoutes'))
app.use('/paymenttypes', require('./routes/PaymentTypesRoutes'))
app.use('/units', require('./routes/UnitsRoutes'))
app.use('/leases', require('./routes/LeasesRoutes'))
app.use('/paymentcategories', require('./routes/PaymentCategoriesRoutes'))
app.use('/leasepayments', require('./routes/LeasePaymentsRoutes'))
app.use('/utilitytypes', require('./routes/UtilityTypesRoutes'))
app.use('/utilities', require('./routes/UtilitiesRoutes'))
app.use('/residents', require('./routes/ResidentsRoutes'))

app.all('*', (req, res) => {
    res.status(404)
    if (req.accepts('html')) {
        res.sendFile(path.join(__dirname, 'views', '404.html'))
    } else if (req.accepts('json')) {
        res.json({ message: '404 Not Found' })
    } else {
        res.type('txt').send('404 Not Found')
    }
})

app.use(errorHandler)

mongoose.connection.once('open', () => {
    console.log('Connected to MongoDB')
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
})

mongoose.connection.on('error', err => {
    console.log(err)
    logEvents(`${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`, 'mongoErrLog.log')
})