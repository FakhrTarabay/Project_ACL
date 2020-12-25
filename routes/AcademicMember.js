////////////////////////////////////////////ACADEMIC MEMBER////////////////////////////////////////////////////////////////////////////////////////////
router.use(async (req, res, next) => {
    try {
        const role = req.user.role
        if (role.includes("Academic Member")) {
            next();
        }
    } catch (error) {
        res.send("You are not allowed!")
        res.end();
    }
})
router.route('/viewSchedule').post(async (req, res) => {
    try {
        const schedule = await scheduleModel.find({ academicMember: req.user.id })
        const startEndDates = getStartEndDates()
        const startDate = startEndDates.startDate
        const endDate = startEndDates.endDate
        const replacementRequests = (await requestModel.find({ receiver: req.user.id, status: 'Accepted' })).filter(function (request) {
            return (compareDates(startDate, request.startDate) <= 0 && compareDates(endDate, request.startDate) >= 0)
        })
        let replacedSlots = []
        for (let i = 0; i < replacementRequests.length; i++) {
            let replacementSlot = {
                date: replacementRequests[i].startDate,
                slot: await scheduleModel.findOne({ _id: replacementRequests[i].schedule_ID })
            }
            replacedSlots.push(replacementSlot)
        }
        const output = {
            schedule: schedule,
            ReplacementSchedule: replacedSlots
        }
        res.send(output)
    } catch (error) {
        res.send(error)
    }
})

router.route('/slotLinking').post(async (req, res) => {
    try {
        const schedule = await scheduleModel.findOne({ _id: req.body.schedule })
        if (schedule) {
            const course = await courseModel.findOne({ name: schedule.course })
            if (course.coordinator) {
                if (course.TAs.includes(req.user.id) || course.instructors.includes(req.user.id) || course.coordinator == req.user.id) {
                    const request = new requestModel({
                        type: 'Slot Linking',
                        sender: req.user.id,
                        receiver: course.coordinator,
                        requestDate: new Date(),
                        status: 'Pending',
                        schedule_ID: req.body.schedule
                    })
                    await request.save()
                    res.send('Request sent Successfully')
                }
                else {
                    res.send(`you are not registered as an academic member in Course ${course.name}`)
                }
            }
            else {
                res.send(`Course ${course.name} does not have a coordinator`)
            }
        }
        else {
            res.send(`Schedule is invalid!`)
        }
    } catch (error) {
        res.send(error)
    }
})

router.route('/viewReplacmentRequest').get(async (req, res) => {
    try {
        const request_sender = await requsetModel.find({ type: 'Replacment', sender: req.user.id })
        const req_reciver = await requsetModel.find({ type: 'Replacment', receiver: req.user.id })
        res.send({ sent_requests: request_sender, recvived_requests: req_reciver })

    } catch (error) {
        res.send(error)
    }
})

function foundAttendaceRecord(records, date) {
    let dayAttendance = records.filter(function (record) {
        return (compareDates(record.date, date) == 0)
    })
    let foundSignOut = false
    for (let i = dayAttendance.length - 1; i >= 0; i--) {
        if (dayAttendance[i].type.localeCompare("signOut") == 0) {
            foundSignOut = true;
        }
        if (foundSignOut && dayAttendance[i].type.localeCompare("signIn") == 0) {
            return true;
        }
    }
}

router.route('/SendRequest').post(async (req, res) => {
    try {
        const member = await staffModel.findOne({ id: req.user.id })
        const department = member.department
        const hod = (await departmentModel.findOne({ name: department })).HOD
        let startDate, endDate
        if (req.body.startDate)
            startDate = (new Date(req.body.startDate)).setHours(2, 0, 0)
        if (req.body.endDate)
            endDate = (new Date(req.body.endDate)).setHours(2, 0, 0)
        if (req.body.type == 'Annual Leaves') {
            if (member.annualLeaves < 1) {
                res.send("you annual balance is insufficient")
            }
            else {
                const sched = await scheduleModel.find({ academicMember: req.user.id, day: req.body.startDate.getDay() });
                if (sched.length != 0 && department) {
                    const request = new requsetModel({
                        type: 'Annual Leaves',
                        sender: req.user.id,
                        receiver: hod,
                        requestDate: (new Date()).setHours(2, 0, 0),
                        status: 'Pending',
                        startDate: startDate,
                        endDate: endDate,
                        comment: req.body.comment
                    })
                    await request.save();
                    res.send("Request sent with success!")
                }
                else {
                    const foundReplacments = (await requsetModel.find({
                        sender: req.user.id,
                        type: 'Replacement',
                        status: 'Accepted'
                    })).filter(function (request) {
                        return compareDates(startDate, request.startDate) == 0
                    })
                    const receivers = foundReplacments.map(function (request) {
                        return request.receiver
                    })
                    // if (foundReplacments.length == sched.length) {
                    const request = new requsetModel({
                        type: 'Annual Leaves',
                        sender: req.user.id,
                        receiver: hod,
                        requestDate: (new Date()).setHours(2, 0, 0),
                        status: 'Pending',
                        startDate: startDate,
                        endDate: endDate,
                        replacementList: receivers
                    })
                    await request.save();
                    res.send("Request sent with success!")
                    // } 
                }
            }
        }
        if (req.body.type == 'Accidental Leaves') {
            if ((member.accidentalLeaves == 0) || (member.annualLeaves < 1)) {
                res.send("Maximum accidental Leaves reached")
            }
            else {
                const request = new requsetModel({
                    type: 'Accidental Leaves',
                    sender: req.user.id,
                    receiver: hod,
                    requestDate: (new Date()).setHours(2, 0, 0),
                    status: 'Pending',
                    startDate: startDate,
                    endDate: endDate,
                    comment: req.body.comment
                })
                await request.save();
                res.send("Request sent with success!")
            }

        }

        if (req.body.type == 'Sick Leaves') {
            if ((req.body.requestDate.getDate() - (new Date()).setHours(2, 0, 0).getDate()) > 3) {
                res.send("Invalid Request")
            } else {
                const request = new requsetModel({
                    type: 'Sick Leaves',
                    sender: req.user.id,
                    receiver: hod,
                    requestDate: (new Date()).setHours(2, 0, 0),
                    status: 'Pending',
                    startDate: startDate,
                    endDate: (new Date(startDate)).setDate(startDate.getDate() + 15),
                    document: req.body.document
                })
                await request.save();
                res.send("Request sent with success!")
            }
        }

        if (req.body.type == 'Maternity Leaves') {
            if (member.gender == 'Male') {
                res.send("Invalid Request")
            } else {
                const request = new requsetModel({
                    type: 'Maternity Leaves',
                    sender: req.user.id,
                    receiver: hod,
                    requestDate: (new Date()).setHours(2, 0, 0),
                    status: 'Pending',
                    startDate: startDate,
                    endDate: (new Date(startDate)).setDate(startDate.getDate() + 15),
                    document: req.body.document
                })
                await request.save();
                res.send("Request sent with success!")
            }
        }

        if (req.body.type == 'Compensation Leaves') {
            const dates = getStartEndDates();
            const Startmonth = dates.startDate;
            const Endmonth = dates.endDate;
            if (compareDates(startDate, Startmonth) == 1 && compareDates(startDate, Endmonth) == -1
                && compareDates(req.body.compensationDate, Startmonth) == 1 && compareDates(req.body.compensationDate, Endmonth) == -1) {
                const foundCompensation = foundAttendaceRecord(member.attendanceRecords, req.compensationDate)
                if (foundCompensation) {
                    const request = new requsetModel({
                        type: 'Compensation Leaves',
                        sender: req.user.id,
                        receiver: hod,
                        requestDate: (new Date()).setHours(2, 0, 0),
                        status: 'Pending',
                        startDate: startDate,
                        endDate: endDate,
                        compensationDate: (new Date(req.body.compensationDate)).setHours(2, 0, 0)
                    })
                    await request.save();
                    res.send("Request sent with success!")

                } else {
                    res.send('invalid compensation request')
                }
            }
        } else {
            res.send('invalid compensation request')
        }


        if (req.body.type == 'Change dayoff') {
            const request = new requsetModel({
                type: 'Change dayoff',
                sender: req.user.id,
                receiver: hod,
                requestDate: (new Date()).setHours(2, 0, 0),
                status: 'Pending',
                changedDayOff: req.body.newDayOff
            })
            await request.save();
            res.send("Request sent with success!")
        }

        if (req.body.type == 'Replacement') {
            const slot = await scheduleModel.findOne({ _id: req.body.slot })
            if (slot) {
                const Course = await courseModel.findOne({ name: slot.course })
                const receiver = await staffModel.findOne({ id: req.body.receiver })

                if (receiver && receiver.department == department &&
                    (Course.TAs.includes(req.body.receiver) || Course.coordinator == req.body.receiver)) {
                    if (startDate.getDay() == slot.day) {
                        const request = new requsetModel({
                            type: 'Replacement',
                            sender: req.user.id,
                            receiver: req.body.receiver,
                            requestDate: (new Date()).setHours(2, 0, 0),
                            startDate: startDate,
                            status: 'Pending',
                            comment: req.body.comment,
                            schedule_ID: req.body.slot

                        })
                        await request.save()
                        res.send("Request sent with success!")
                    } else {
                        res.send("No avaliable schedules on this day")
                    }

                } else {
                    res.send("Can't find a reciver")
                }
            }
            else {
                res.send("make sure to select a valid Slot")
            }
        }
        else
            res.send("there is an error sending your request")
    } catch (error) {
        res.send(error)
    }
})

router.route('/ViewRequest').get(async (req, res) => {
    try {
        const request = await requsetModel.find({ sender: req.body.sender, type: req.body.type })
        res.send(request)
    } catch (error) {
        res.send(error)
    }
})

router.route('/CancelRequest').post(async (req, res) => {
    try {
        const request = await requsetModel.findOne({ _id: req.body._id })
        if (request) {
            if (request.status == 'Pending' && (compareDates(request.startDate, (new Date()).setHours(2, 0, 0)) == 1)) {
                await requsetModel.deleteOne({ _id: request._id })
                res.send("Request deleted successfully!")
            }
            else {
                res.send("Can't cancel a non pending request")
            }
        } else {
            res.send("Can't find request")
        }
    }
    catch (error) {
        res.send(error)
    }
})