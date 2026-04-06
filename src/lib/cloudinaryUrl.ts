export const getCloudinaryUrl=(file:any)=>{
    const cloud_name=process.env.CLOUDINARY_KEY_NAME;

    if(!file?.public_id) return "";

    // Determine resource type based on file type or stored resource_type
    let resourceType = file.resource_type || "auto";
    const fileType = file.fileType || file.mimeType;

    if (fileType?.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].some(ext => file.originalName?.toLowerCase().includes(ext))) {
        resourceType = "image";
    } else if (fileType?.includes('video') || ['mp4', 'webm', 'mov'].some(ext => file.originalName?.toLowerCase().includes(ext))) {
        resourceType = "video";
    } else if (fileType?.includes('pdf') || file.originalName?.toLowerCase().endsWith('pdf')) {
        resourceType = "raw";
    }

    return `https://res.cloudinary.com/${cloud_name}/${resourceType}/upload/${file.public_id}`;
}