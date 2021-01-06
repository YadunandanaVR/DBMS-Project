require('dotenv').config();
var express = require('express');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var ejs = require('ejs');
var session = require('express-session');

var app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.use(express.static('public'));

app.use(session({
  secret: process.env.SECRET,
  resave: true,
  saveUninitialized: true
}));

var connection = mysql.createConnection({
  host: process.env.HOST_NAME,
  user: process.env.USER_NAME,
  password: process.env.USER_PASSWORD,
  database: process.env.DATABASE_NAME
});

connection.connect(function(error) {
  if (error) throw error;
  console.log('MqSql Connected');
});


//  ------------------------------------------------ welcome Page --------------------------------------------------


app.get('/', function(req, res) {
  res.render('Welcome');
});


//  ------------------------------------------------ Contact Page --------------------------------------------------


app.get('/contact', function(req, res) {
  res.render('contact');
});


//  ----------------------------------- User and Admin Login and Logout Page ---------------------------------------

//  ------------User login and logout page


app.get('/userlogin', function(req, res) {
  res.render('login/login', {
    message: ''
  });
});


app.post('/userlogin', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  if (username && password) {
    connection.query('SELECT * FROM customers WHERE customer_username = ? AND customer_pass = ?', [username, password], function(error, results) {
      // console.log(results)
      if (results.length > 0) {
        req.session.loggedin = true;
        req.session.username = username;
        res.redirect('/userAccountSummary');
      } else {
        return res.render('login/login', {
          message: 'Incorrect Username and/or Password!'
        });
      }
      res.end();
    });
  } else {
    return res.render('login/login', {
      message: 'Please enter Username and Password!'
    });
  }
});


app.get('/userlogout', function(req, res) {
  req.session.destroy(function(err) {
    res.render('login/login', {
      message: 'Successfully Loged Out ✔'
    });
  });
});


//  --------------- Admin Login and Logout page


app.get('/adminlogin', function(req, res) {
  res.render('login/adminlogin', {
    message: ''
  });
});


app.post('/adminlogin', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  if (username && password) {
    connection.query('SELECT * FROM staffs WHERE staff_username = ? AND staff_pass = ?', [username, password], function(error, results) {
      if (results.length > 0) {
        req.session.loggedin = true;
        req.session.username = username;
        res.redirect('/adminAddUsers');
      } else {
        return res.render('login/adminlogin', {
          message: 'Incorrect Username and/or Password!'
        });
      }
      res.end();
    });
  } else {
    return res.render('login/adminlogin', {
      message: 'Please enter Username and Password!'
    });
  }
});


app.get('/adminlogout', function(req, res) {
  req.session.destroy(function(err) {
    res.render('login/adminlogin', {
      message: 'Successfully Loged Out ✔'
    });
  });
});



//  ------------------------------- Admin ( add, update, remove, bill Generate ) Page ----------------------------------

//  --------------------- Admin Add User Page


app.get('/adminAddUsers', function(req, res) {
  if (req.session.loggedin) {
    res.render('admin/adminAddUser', {
      message: ''
    });
  } else {
    res.render('login/adminlogin', {
      message: 'Please login to view this page!'
    });
  }
  res.end();
});


app.post('/adminAddUsers', function(req, res) {

  var account_number = Math.floor(Math.random() * 100000 + 1);
  var rr_no = Math.floor(Math.random() * 1000000 + 1);

  var accounts_data = {
    account_number: account_number,
    rr_number: rr_no,
    account_holder_fname: req.body.fname,
    account_holder_lname: req.body.lname,
    account_holder_DOB: req.body.dob,
    account_holder_address: req.body.address,
	electric_board_name : req.body.board_name
  }

  if (req.body.fname == '' || req.body.lname == '' || req.body.dob == '' || req.body.address == '' || req.body.board_name == '') {
    res.render('admin/adminAddUser', {
      message: 'No fields should not be left empty!'
    });
  } else {

    var q1 = 'SELECT account_number FROM accounts WHERE account_number = ?';
    connection.query(q1, [account_number], function(error, account_result) {
      if (error) throw error;

      if (account_result.length > 0) {
        return res.render('admin/adminAddUser', {
          message: 'Somthing went Wrong please try again!'
        });
      } else {
        var electric_board_name = req.body.board_name;

        if (electric_board_name == 'BESCOM') {
          var q2 = 'INSERT INTO accounts SET ?';
          connection.query(q2, accounts_data, function(error, result) {
            if (error) throw error;
            res.render('admin/adminAddUser', {
              message: 'Account Successfully Added ✔'
            });
          });
        } else {
          res.render('admin/adminAddUser', {
            message: 'Invalid Electric Board Name!'
          });
        }
      }
    });
  }
});


// --------------- Admin Update user Page

app.get('/adminUpdateUser', function(req, res) {
  if (req.session.loggedin) {
    res.render('admin/adminUpdateUser', {
      message: ''
    });
  } else {
    res.render('login/adminlogin', {
      message: 'Please login to view this page!'
    });
  }
});


app.post('/adminUpdateUser', function(req, res) {

  var check_account_number = req.body.account_no;

  var accounts_data = {
    account_number: req.body.account_no,
    account_holder_fname: req.body.fname,
    account_holder_lname: req.body.lname,
    account_holder_DOB: req.body.dob,
    account_holder_address: req.body.address,
    electric_board_name: req.body.board_name
  }

  if (req.body.account_no == '' || req.body.fname == '' || req.body.lname == '' || req.body.dob == '' || req.body.address == '' || req.body.board_name == '') {
    res.render('admin/adminUpdateUser', {
      message: 'No fields should not be left empty!'
    });
  } else {

    var q1 = 'SELECT account_number FROM accounts WHERE account_number = ?';

    connection.query(q1, [check_account_number], function(error, account_result) {
      if (error) throw error;

      if (account_result.length > 0) {

        var electric_board_name = req.body.board_name;

        if (electric_board_name == 'BESCOM') {
          var q2 = 'UPDATE accounts SET ? WHERE account_number = ?';

          connection.query(q2, [accounts_data, req.body.account_no], function(error, result) {
            if (error) throw error;

            return res.render('admin/adminUpdateUser', {
              message: 'Account Successfully Updated ✔'
            });
          });
        } else {
          res.render('admin/adminUpdateUser', {
            message: 'Invalid Electric Board Name!'
          });
        }
      } else {
        return res.render('admin/adminUpdateUser', {
          message: 'Account Number does not exists'
        });
      }
    });
  }
});


// ---------------- Admin Generate bill Page

app.get('/adminGenerateBill', function(req, res) {
  if (req.session.loggedin) {
    res.render('admin/adminGenerateBill', {
      message: ''
    });
  } else {
    res.render('login/adminlogin', {
      message: 'Please login to view this page!'
    });
  }
});


app.post('/adminGenerateBill', function(req, res) {

  var account_number = req.body.account_no;
  var bill_no = Math.floor(Math.random() * 1000000 + 1);
  var prev_reading = Number(req.body.prev_read);
  var pres_reading = Number(req.body.pres_read);
  var consumption_unit = pres_reading - prev_reading;
  var bill_amount = consumption_unit * 9;
  var total_bill_amount = bill_amount + Number(req.body.tax);

  var q1 = 'SELECT account_number FROM accounts WHERE account_number = ?';

  connection.query(q1, [account_number], function(error, account_result) {
    if (error) throw error;

    if (account_result.length > 0) {

      var q1 = "SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS due_date";
      connection.query(q1, function(error, result) {
        if (error) throw error;
        var due_date = result[0].due_date;

        var q2 = 'SELECT DATE_ADD( ? , INTERVAL 1 MONTH) AS due_date';

        connection.query(q2, due_date, function(error, add_result) {
          if (error) throw error;
          var add_due_date = add_result[0].due_date;

          var q3 = 'SELECT rr_number FROM accounts WHERE account_number = ?';
          connection.query(q3, [account_number], function(error, rr_result) {
            if (error) throw error;

            if (rr_result.length > 0) {


              if (prev_reading < pres_reading) {
                var bill_data = {
                  bill_no: String(bill_no),
                  rr_no: req.body.rr_no,
                  consumption_unit: consumption_unit,
                  bill_amount: bill_amount,
                  tax: req.body.tax,
                  due_date: add_due_date,
                  total_bill_amount: String(total_bill_amount),
                  account_number: req.body.account_no
                }

                var q4 = 'INSERT INTO bills SET ?';

                connection.query(q4, [bill_data], function(error, result) {
                  if (error) throw error;
                  res.render('admin/adminGenerateBill', {
                    message: 'Bill Successfully Generated'
                  });
                });
              } else {
                res.render('admin/adminGenerateBill', {
                  message: 'Invalid Readings! -> (pres_reading must be > prev_reading)'
                });
              }
            } else {
              res.render('admin/adminGenerateBill', {
                message: 'Invalid rr_no!'
              });
            }
          });
        });
      });
    } else {
      res.render('admin/adminGenerateBill', {
        message: 'Account Number does not exists'
      });
    }
  });
});


//  ------------- Admin Remove Page

app.get('/adminRemoveUsers', function(req, res) {
  if (req.session.loggedin) {
    res.render('admin/adminRemoveUser', {
      message: ''
    });
  } else {
    res.render('login/adminlogin', {
      message: 'Please login to view this page!'
    });
  }
});


app.post('/adminRemoveUsers', function(req, res) {

  var q1 = 'SELECT account_number FROM accounts WHERE account_number = ?';

  connection.query(q1, [req.body.account_no], function(error, account_result) {
    if (error) throw error;

    if (account_result.length > 0) {
      var q2 = 'DELETE FROM accounts WHERE account_number = ?';

      connection.query(q2, [req.body.account_no], function(error, result, fields) {
        if (error) throw error;
      });
      res.render('admin/adminRemoveUser', {
        message: 'Account Successfully Deleted ✔'
      });
    } else {
      res.render('admin/adminRemoveUser', {
        message: 'Account Number does not exists'
      });
    }
  });
});


//  ---------------------------------------------- Admin Select Page -----------------------------------------------

//  -------------  Admin Select accounts

app.get('/adminSelectAccounts', function(req, res) {

  if (req.session.loggedin) {

    var q = "SELECT account_id, account_number, rr_number, account_holder_fname, account_holder_lname, DATE_FORMAT(account_holder_DOB, '%Y-%m-%d') AS account_holder_DOB, account_holder_address, electric_board_name FROM accounts";

    connection.query(q, function(error, result) {
      if (error) throw error;
      res.render('adminSelect/adminSelectAccounts', {
        accounts_data: result
      });
    });
  } else {
    res.render('login/adminlogin', {
      message: 'Please login to view this page!'
    });
  }
});


//  ----------------Admin Select Removed accounts

app.get('/adminSelectRemovedAccounts', function(req, res) {

  if (req.session.loggedin) {

    var q = "SELECT account_id, account_number, rr_number, account_holder_fname, account_holder_lname, DATE_FORMAT(account_holder_DOB, '%Y-%m-%d') AS account_holder_DOB, account_holder_address, electric_board_name FROM removed_accounts";

    connection.query(q, function(error, removed_result) {
      if (error) throw error;
		
      res.render('adminSelect/adminSelectRemovedAccounts', {
        accounts_data: removed_result
      });
    });
  } else {
    res.render('login/adminlogin', {
      message: 'Please login to view this page!'
    });
  }
});


//  -------------  Admin Select Users

// app.get('/adminSelectUsers', function(req, res) {

//   if (req.session.loggedin) {
//     var q = "SELECT user_id,user_name, user_account_number, user_email, user_password, DATE_FORMAT(created_at, '%d-%m-%Y') AS created_at FROM users";

//     connection.query(q, function(error, result) {
//       if (error) throw error;
//       res.render('adminSelect/adminSelectUsers', {
//         users_data: result
//       });
//     });
//   } else {
//     res.render('login/adminlogin', {
//       message: 'Please login to view this page!'
//     });
//   }
// });

//  ---------- Admin Select Customers

app.get('/adminSelectCustomers', function(req, res) {

  if (req.session.loggedin) {
    var q = 'SELECT * FROM customers';

    connection.query(q, function(error, result) {
      if (error) throw error;
      res.render('adminSelect/adminSelectCustomers', {
        customers_data: result
      });
    });
  } else {
    res.render('login/adminlogin', {
      message: 'Please login to view this page!'
    });
  }
});

//  ------------- Admin select feedbacks

app.get('/adminSelectFeedbacks', function(req, res) {

  if (req.session.loggedin) {

    var q = 'SELECT * FROM feedbacks';

    connection.query(q, function(error, result) {
      if (error) throw error;
      res.render('adminSelect/adminSelectFeedbacks', {
        feedbacks_data: result
      });
    });
  } else {
    res.render('login/adminlogin', {
      message: 'Please login to view this page!'
    });
  }
});


//   --------------------------------------------- Registration Page  -------------------------------------------------

app.get('/register', function(req, res) {

  res.render('register', {
    message: 'Ok'
  });
});

app.post('/register', function(req, res) {

  var customers_data = {
    customer_fname: req.body.first_name,
    customer_lname: req.body.last_name,
    customer_address: req.body.address,
    customer_phone_number: req.body.phon_no,
    customer_city: req.body.city,
    customer_state: req.body.state,
    customer_pincode: req.body.pincode,
	customer_username: req.body.username,
	customer_pass: req.body.password,
    account_number: req.body.account_no
  }

  if (req.body.first_name == '' || req.body.last_name == '' || req.body.address == '' || req.body.phon_no == '' || req.body.city == '' || req.body.state == '' || req.body.pincode == '' || req.body.account_no == '') {
    return res.render('register', {
      message: 'No fields should not be left empty!'
    });
  } else {

    var q0 = 'SELECT customer_username FROM customers WHERE customer_username = ?';
    var q2 = 'SELECT account_number FROM accounts WHERE account_number = ?';
    var q3 = 'SELECT customer_phone_number FROM customers WHERE customer_phone_number = ?';
    var q4 = 'SELECT account_number FROM customers WHERE account_number = ?';

    connection.query(q0, [req.body.username], function(error, result) {
      if (error) {
        return console.log(error);
      }

      if (result.length > 0) {
        return res.render('register', {
          message: 'Username already taken'
        });
      }

      if (req.body.username != req.body.reenter_username) {
        return res.render('register', {
          message: 'Usernames does not match.'
        });
      }

      if (req.body.password != req.body.reenter_password) {
        return res.render('register', {
          message: 'Passwords does not match.'
        });
      }

        connection.query(q2, [req.body.account_no], function(error, result) {
          if (error) {
            return console.log(error);
          }

          if (result.length <= 0) {
            return res.render('register', {
              message: 'Invalid account no'
            });
          }

          connection.query(q4, [req.body.account_no], function(error, user_acc_result) {
            if (user_acc_result.length > 0) {
              return res.render('register', {
                message: 'Entered Account Number already registered!'
              });
            } else {


              connection.query(q3, [req.body.phon_no], function(error, result) {
                if (error) {
                  return console.log(error);
                }

                if (result.length > 0) {
                  return res.render('register', {
                    message: 'Phone Number already exists'
                  });
                } else {
                  var q6 = 'INSERT INTO customers SET ?';


                  connection.query(q6, customers_data, function(error, result) {
                    if (error) throw error;
                  });

                  res.render('login/login', {
                    message: 'User successfully Registered'
                  });
                }
              });
            }
          });
        });
    });
  }
});


// ---------------------------------------------------- User Pages -----------------------------------------------------

//  ------------- User Account Summary Page

app.get('/userAccountSummary', function(req, res) {

  if (req.session.loggedin) {
    var message = 'Welcome back, ' + req.session.username + '!';
    var username = req.session.username;
    var q1 = 'SELECT account_number FROM customers WHERE customer_username = ?';
    connection.query(q1, [username], function(error, result) {
      if (error) throw error;
      var account_number = result[0].account_number;

      var q2 = "SELECT account_number, account_holder_fname, account_holder_lname, DATE_FORMAT(account_holder_DOB, '%d-%m-%Y') AS account_holder_DOB, account_holder_address, electric_board_name FROM accounts WHERE account_number = ?";

      connection.query(q2, [account_number], function(error, profileResult) {
        // console.log(profileResult);
        if (error) throw error;

          res.render('userPages/accountSummary', {
            message: message,
            profile: profileResult,
            username: username
          });
    
      });
    });
  } else {
    res.render('login/login', {
      message: 'Please login to view this page!'
    });
  }
});


//  -------------- User Profile Page

app.get('/userProfile', function(req, res) {
  if (req.session.loggedin) {
    var message = 'Welcome back, ' + req.session.username + '!';
    var username = req.session.username;
    var q1 = 'SELECT account_number FROM customers WHERE customer_username = ?';
    var q2 = 'SELECT customer_username, customer_pass, account_number, customer_fname, customer_lname, customer_address, customer_phone_number, customer_city, customer_state, customer_pincode FROM customers WHERE account_number = ?;';


    connection.query(q1, [username], function(error, result) {
      if (error) throw error;
      var account_number = result[0].account_number;

      connection.query(q2, [account_number], function(error, userResult) {
        // console.log(userResult);
        if (error) throw error;

        res.render('userPages/userProfile', {
          message: message,
          user_data: userResult,
          username: username
        });
      });
    });
  } else {
    res.render('login/login', {
      message: 'Please login to view this page!'
    });
  }
});

app.post('/userProfileUpdate', function(req, res) {
  if (req.session.loggedin) {


    var customer_edited_data = {
      customer_fname: req.body.first_name,
      customer_lname: req.body.last_name,
      customer_address: req.body.address,
      customer_city: req.body.city,
      customer_state: req.body.state,
      customer_pincode: req.body.pincode,
	  customer_pass: req.body.password
    }

    var username = req.session.username;
    var q2 = 'SELECT account_number FROM customers WHERE customer_username = ?';
    var q3 = 'UPDATE customers SET ? WHERE account_number =?';


      connection.query(q2, [username], function(error, accountNoResult) {
        if (error) throw error;
        var account_number = accountNoResult[0].account_number;

        connection.query(q3, [customer_edited_data, account_number], function(error, customerResult) {
          if (error) throw error;

          res.redirect('/userProfile');
        });
      });
  } else {
    res.render('login/login', {
      message: 'Please login to view this page!'
    });
  }
});

//  ------------- User View Bill Page

app.get('/userViewBill', function(req, res) {
  if (req.session.loggedin) {
    var username = req.session.username;

    var q0 = 'SELECT account_number FROM customers WHERE customer_username = ?';

    connection.query(q0, [username], function(error, accountResult) {
      if (error) throw error;
      var account_number = accountResult[0].account_number;

      var q1 = 'SELECT bill_no FROM bills WHERE account_number = ?';

      connection.query(q1, [account_number], function(error, dataResult) {
        if (error) throw error;

        if (dataResult.length > 0) {

          var q3 = "SELECT bill_no, rr_no, consumption_unit, bill_amount, tax, total_bill_amount, DATE_FORMAT(due_date, '%Y-%m-%d') AS due_date, IFNULL(paid_amount, 0) AS paid_amount, CASE WHEN paid_amount IS NULL THEN 'Not Paid' WHEN paid_amount = total_bill_amount THEN 'Paid' WHEN paid_amount = 0 THEN 'Not Paid' WHEN paid_amount != total_bill_amount THEN 'Partially Paid' END AS payment_status, IFNULL(payment_date, '-') AS payment_date FROM bills WHERE account_number = ? ORDER BY due_date DESC LIMIT 1";

          connection.query(q3, [account_number], function(error, result) {
            if (error) throw error;
            res.render('userPages/viewBill', {
              bill_data: result,
              username: username
            });
          });
        } else {
          res.render('userPages/noBill', {
            message: 'View/Pay Bill',
            alertMessage: '',
            username: username
          });
        }
      });
    });
  } else {
    res.render('login/login', {
      message: 'Please login to view this page!'
    });
  }
});

app.post('/userViewBill', function(req, res) {
  if (req.session.loggedin) {

    var username = req.session.username;
    var q0 = 'SELECT account_number FROM customers WHERE customer_username = ?';

    connection.query(q0, [username], function(error, account_result) {
      if (error) throw error;
      var account_number = account_result[0].account_number;

      var q1 = 'SELECT bill_no FROM bills WHERE account_number = ? HAVING bill_no = ?';

      connection.query(q1, [account_number, req.body.bill_no], function(error, bill_check_result) {
        if (error) throw error;

        if (bill_check_result.length > 0) {

          if (req.body.paid_amount == '' || req.body.paid_amount == 0) {
            res.redirect('/userViewBill');
          } else {

            var q2 = "SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS cur_date";

            connection.query(q2, function(error, result) {
              if (error) throw error;
              var cur_date = result[0].cur_date;
              // console.log(cur_date);

              var bill_no = req.body.bill_no;
              var paid_amount = req.body.paid_amount;

              var q3 = 'UPDATE bills SET paid_amount = ?, payment_date = ?  WHERE bill_no = ?';

              connection.query(q3, [paid_amount, cur_date, bill_no], function(error, bill_result) {
                if (error) throw error;
                res.redirect('/userViewBill');
              });
            });
          }
        } else {
          res.render('userPages/noBill', {
            message: 'View/Pay Bill',
            alertMessage: 'Invalid Bill Number please check the bill Number',
            username: username
          });
        }
      });
    });
  } else {
    res.render('login/login', {
      message: 'Please login to view this page!'
    });
  }
});

//  ------------- User No Bill Page

app.get('/noBill', function(req, res) {
  if (req.session.loggedin) {
    var message = 'Welcome back, ' + req.session.username + '!';
    var username = req.session.username;
    res.render('userPages/noBill', {
      message: '',
      alertMessage: '',
      username: username
    });
  } else {
    res.render('login/login', {
      message: 'Please login to view this page!'
    });
  }
});

//  -------------- User Billing History Page

app.get('/userBillingHistory', function(req, res) {
  if (req.session.loggedin) {
    var message = 'Welcome back, ' + req.session.username + '!';

    var username = req.session.username;
    var q0 = 'SELECT account_number FROM customers WHERE customer_username = ?'

    connection.query(q0, [username], function(error, accountResult) {
      if (error) throw error;
      var account_number = accountResult[0].account_number;

      var q1 = 'SELECT bill_no FROM bills WHERE account_number = ?';

      connection.query(q1, [account_number], function(error, dataResult) {
        if (error) throw error;

        if (dataResult.length > 0) {

          var q2 = "SELECT bill_no, rr_no, consumption_unit, bill_amount, tax, total_bill_amount, DATE_FORMAT(due_date, '%Y-%m-%d') AS due_date, IFNULL(paid_amount, 0) AS paid_amount, CASE WHEN paid_amount IS NULL THEN 'Not Paid' WHEN paid_amount = total_bill_amount THEN 'Paid' WHEN paid_amount = 0 THEN 'Not Paid' WHEN paid_amount != total_bill_amount THEN 'Partially Paid' END AS payment_status, IFNULL(payment_date, '-') AS payment_date FROM bills WHERE account_number = ? ORDER BY due_date";

          connection.query(q2, [account_number], function(error, result) {
            if (error) throw error;

            res.render('userPages/billingHistory', {
              message: message,
              bill_data: result,
              username: username
            });
          });
        } else {
          res.render('userPages/noBill', {
            message: 'Billing History',
            alertMessage: '',
            username: username
          });
        }
      });
    });
  } else {
    res.render('login/login', {
      message: 'Please login to view this page!'
    });
  }
});


//  --------------- Feedback page

app.get('/userFeedback', function(req, res) {
  if (req.session.loggedin) {
    var username = req.session.username;
    res.render('userPages/userFeedback', {
      message: '',
      username: username
    });
  } else {
    res.render('login/login', {
      message: 'Please login to view this page!'
    });
  }
});


app.post('/userFeedback', function(req, res) {
  if (req.session.loggedin) {
    var username = req.session.username;

    var q1 = 'SELECT account_number FROM customers WHERE customer_username = ?';
    connection.query(q1, [username], function(error, result) {
      if (error) throw error;
      var account_number = result[0].account_number;

      var feedback_data = {
        feedback_desc: req.body.feedback,
        account_number: account_number
      }

      var q2 = 'INSERT INTO feedbacks SET ?';
      connection.query(q2, [feedback_data], function(error, feedback_result) {
        if (error) throw error;
        res.render('userPages/userFeedback', {
          message: 'Feedback Successfully Submitted ✔',
          username: username
        });
      });
    });
  } else {
    res.render('login/login', {
      message: 'Please login to view this page!'
    });
  }

});


app.listen(3000, function() {
  console.log('server started on port 3000!');
});
