import nodemailer from "nodemailer"


export const sendVerificationEmail=async (email:string,name:string,code:string)=>{
    try {
        const transporter=nodemailer.createTransport({
            service:"gmail",
            auth:{
                user:process.env.SMTP_USER,
                pass:process.env.SMTP_PASS,
            }
        })

        const mailOptions={
              from: `"My App" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Verify your account",
      html: `
        <p>Hi <b>${name}</b>,</p>
        <p>Thank you for signing up! Your verification code is:</p>
        <h2 style="color:#2c7be5">${code}</h2>
        <p>This code will expire in 15 minutes.</p>
      `,
        }

        await transporter.sendMail(mailOptions)
        console.log(
            "verification email sent via NodeMailer"
        );
        
    } catch (error:any) {
            console.log("NodeMailer error:",error.message);
            throw new Error("Failed to send verification email")

    }
}