import React from "react";

const ImageUploader = ({imageUploadHandler, image}) => {
    return (
        <div>
            <input className="btn-primary" type="file" onChange={imageUploadHandler}/>
            <div className="image-container">
                {image && <img className="uploaded-image" alt='Uploaded Image' src={URL.createObjectURL(image)}/>}
            </div>
        </div>
);
}

export default ImageUploader;