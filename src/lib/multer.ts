import multer from "multer";

const storage=multer.memoryStorage();

const upload=multer({
    storage,
    limits:{
        fileSize:10*1024*1024,
    },
    fileFilter:(_req,file,cb)=>{
        const ALLOWED_MIME = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "text/csv",
    ];
    if(ALLOWED_MIME.includes(file.mimetype)){
        cb(null,true);
    }else{
        cb(new Error(`File type ${file.mimetype} is not allowed`))
    }
    }
})

export default upload;