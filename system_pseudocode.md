# System Modules Pseudocode

This document contains the pseudocode logic for all the standard modules within the UCGuides (SYSARCH) application.

### 1. Home Menu
```pascal
START HomeMenu
    INITIALIZE default database entries (seedData)
    IF session.currentUser EXISTS THEN
        REDIRECT TO User Dashboard based on Role
    ELSE
        DISPLAY "Choose Role" UI
        WAIT FOR interaction
        IF Student is selected THEN
            REDIRECT TO Student Entry
        ELSE IF Facilitator is selected THEN
            REDIRECT TO Admin/Facilitator Entry
        END IF
    END IF
END HomeMenu
```

### 2. Login Dashboard (User Verification)
```pascal
START UserVerification(email, password, role)
    FETCH users FROM Database WHERE user.role = role
    FOR EACH user IN users
        IF user.email EQUALS email AND user.password EQUALS password THEN
            RETURN user
        END IF
    END FOR
    RETURN NULL // Verification failed
END UserVerification
```

### 3. Student Entry (Login/Register)
```pascal
START StudentEntry
    DISPLAY Student Login/Register Form
    WAIT FOR form submission
    
    IF action IS "Register" THEN
        VALIDATE input fields (email, password, schoolId, etc.)
        IF valid THEN
            INSERT new student INTO Database
            SET session.currentUser = new student
            REDIRECT TO Student Dashboard
        ELSE
            DISPLAY "Validation Error"
        END IF
    ELSE IF action IS "Login" THEN
        CALL UserVerification(email, password, "student")
        IF verified THEN
             SET session.currentUser = verified user
             REDIRECT TO Student Dashboard
        ELSE
             DISPLAY "Invalid Credentials"
        END IF
    END IF
END StudentEntry
```

### 4. Admin/Facilitator Entry
```pascal
START FacilitatorEntry
    DISPLAY Facilitator Login Form
    WAIT FOR form submission
    CALL UserVerification(email, password, "facilitator")
    
    IF verified THEN
         SET session.currentUser = verified facilitator
         REDIRECT TO Facilitator Dashboard
    ELSE
         DISPLAY "Invalid Credentials"
    END IF
END FacilitatorEntry
```

### 5. Student Process (Main Dashboard)
```pascal
START StudentDashboard
    GET currentUser FROM session
    IF currentUser IS NULL OR role IS NOT "student" THEN
        CALL LogoutModule
    END IF
    
    FETCH appointments FROM Database WHERE studentId = currentUser.id
    DISPLAY Dashboard UI
    DISPLAY Student Statistics (Total Sessions, Status)
    DISPLAY List of Appointments
END StudentDashboard
```

### 6. Student Profile (View/Edit Profile)
```pascal
START StudentProfile
    GET currentUser FROM session
    FETCH studentData FROM Database WHERE id = currentUser.id
    DISPLAY Profile Form with studentData pre-filled
    
    WAIT FOR "Update" click
    VALIDATE new input data
    UPDATE Database TABLE students WITH new data
    DISPLAY "Profile Updated Successfully"
END StudentProfile
```

### 7. Communication Inbox (Messaging)
```pascal
START CommunicationInbox
    GET currentUser FROM session
    FETCH messages FROM Database WHERE "to" = currentUser.id OR "from" = currentUser.id
    SORT messages BY timestamp ASCENDING
    
    DISPLAY Message Thread
    WAIT FOR Send Message action
    IF message input IS NOT EMPTY THEN
        CREATE new message object
        INSERT message INTO Database
        RELOAD CommunicationInbox
    END IF
END CommunicationInbox
```

### 8. Scheduling Module (Book a Session)
```pascal
START SchedulingModule
    GET currentUser FROM session
    DISPLAY Appointment Booking Form (Date, Time, Reason)
    
    WAIT FOR form submission
    IF form is valid THEN
        CREATE new Appointment object
            SET status = "pending"
            SET studentId = currentUser.id
        INSERT Appointment INTO Database
        DISPLAY "Appointment Request Submitted"
        RELOAD StudentDashboard
    ELSE
        DISPLAY "Please fill all required fields"
    END IF
END SchedulingModule
```

### 9. Facilitator Process (Main Dashboard)
```pascal
START FacilitatorDashboard
    GET currentUser FROM session
    IF currentUser IS NULL OR role IS NOT "facilitator" THEN
        CALL LogoutModule
    END IF
    
    FETCH ALL appointments FROM Database
    FETCH ALL students FROM Database
    
    DISPLAY Dashboard UI
    DISPLAY Global System Statistics
    DISPLAY Master List of all Appointments
END FacilitatorDashboard
```

### 10. Student Update (Facilitator Managing Appointments)
```pascal
START StudentUpdate(appointmentId, newStatus)
    FETCH appointment FROM Database WHERE id = appointmentId
    
    WAIT FOR Facilitator Action (Approve, Reject, or Update Session Step)
    UPDATE appointment.status = newStatus 
    // Example: changing session progress from "pending" to "done"
    
    SAVE updated appointment TO Database
    CALL NotificationModule(appointment.studentId, "Your appointment status was updated.")
    RELOAD FacilitatorDashboard
END StudentUpdate
```

### 11. Notification Module
```pascal
START NotificationModule(studentId, alertMessage)
    // Note: In an advanced system, this would push a web notification or email
    CREATE new system_alert
        SET message = alertMessage
        SET targetUser = studentId
    INSERT system_alert INTO Database
    DISPLAY visual Toast notification on screen
END NotificationModule
```

### 12. Logout Module
```pascal
START LogoutModule
    REMOVE currentUser FROM SessionStorage
    CLEAR local application memory variables
    REDIRECT TO HomeMenu (index.html)
END LogoutModule
```
