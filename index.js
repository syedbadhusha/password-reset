const express = require("express");
const { MongoClient } = require("mongodb");
const nodemailer = require("nodemailer");
const cors = require('cors')
const app = express();
app.use(cors())
app.listen(3000);
app.use(express.json());

const URL =
  "mongodb+srv://admin:admin123@loopacc.vzozr5w.mongodb.net/?retryWrites=true&w=majority&appName=loopacc";
/// API to create user
app.post("/creatuser", async (req, res) => {
  try {
    const connection = await MongoClient.connect(URL);
    const db = connection.db("passwordreset");
    const collection = db.collection("user");
    const userAvail = collection.findOne({mailid:req.body.mailid})
    if(userAvail){
      throw "User Already Exist's"
    }else{
      await collection.insertOne(req.body);
      await connection.close();
      res.json({ message: "user Created" });  
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({message:err});
  }
});
// API to mail OTP to reset password
app.get("/userbymailid", async (req, res) => {
    const otpLink = req.body.otplink
  try {
    const connection = await MongoClient.connect(URL);
    const db = connection.db("passwordreset");
    const collection = db.collection("user");
    const userbymailid = await collection.findOne({ mailid: req.body.mailid });
    await connection.close();
    if (!userbymailid) {
      throw "User Doesn't Exist"
    } else {
        function generateRandomString() {
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let randomString = '';
            for (let i = 0; i < 6; i++) {
              const randomIndex = Math.floor(Math.random() * characters.length);
              randomString += characters.charAt(randomIndex);
            }
            return randomString;
          }
          const genotp = generateRandomString();
    //   const genotp = Math.floor(Math.random() * 900000) + 100000;
      const reqmailid = req.body.mailid;
      const transporter = nodemailer.createTransport({
        service: "Gmail",
        host: "smtp.gmail.com",
        port: 465,
        auth: {
          user: "syedbadhusha21@gmail.com",
          pass: "cpktpepxxmewbswb",
        },
      });
      const mailing = {
        from: "Syed Badhusha <syedbadhusha21@gmail.com>",
        to: reqmailid,
        subject: "Your OTP to Reset password",
        text: `Please find your OTP Here ${genotp.toString()} click here to enter OTP ${otpLink}`,
      };
      try {
        await transporter.sendMail(mailing);
      } catch (err) {
        console.log(err.message)
      }
      const connectionotp = await MongoClient.connect(URL);
      const db = connectionotp.db("passwordreset");
      const collectionotp = db.collection("user");
      await collectionotp.updateOne(
        { mailid: req.body.mailid },
        { $set: { otp: genotp } }
      );
      await connectionotp.close();
      res.status(200).json({ message:"OTP Generated successfully" });
    }
  } catch (err) {
    res.status(404).json({message:err});
  }
});
// API to check Enterd OTP correct or not
app.get('/verifyotp',async (req,res)=>{
    const mailid = req.body.mailid
    const otpCheck = req.body.otp
    try{
        const connect = await MongoClient.connect(URL);
        const db = connect.db('passwordreset')
        const collection = db.collection('user')
        const verifyOtp = await collection.findOne({mailid:mailid} && {otp:otpCheck})
        await connect.close();
        if(!verifyOtp)
        throw 'Entered OTP is Incorrect please check'
        res.status(200).json({message:"OTP has accepted successfully"});    
    }catch(error){
        res.status(501).json({message:error});    
    }
    
})
// API to set new password
app.put('/updatenewpassword',async (req,res)=>{
    const mailid = req.body.mailid;
    const newPassword = req.body.newPassword
    const reEnterdPassword = req.body.reEnterdPassword
    try{
        if(newPassword !== reEnterdPassword)
        {
            throw 'New Password and Re-Entered Password is Not Matching'
        }else{
            const connection = await MongoClient.connect(URL)
            const db = connection.db('passwordreset')
            const collection = db.collection('user');
            await collection.updateOne({mailid:mailid},{$set:{password:newPassword}})
            await collection.updateOne({mailid:mailid},{$unset:{otp:false}})
            await connection.close();
            res.status(200).json({message:"Password Updated successfully"})
        }
    }catch(error){
        res.status(500).json({message:error})
    }
})
