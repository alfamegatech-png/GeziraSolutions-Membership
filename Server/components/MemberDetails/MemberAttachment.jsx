

import React, { useState, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { createMemberAttachment, getMemberAttachments } from '@components/Members/member';

const MemberAttachment = ({ memberId }) => {
    const [uploadDialog, setUploadDialog] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]); 
    const toast = useRef(null);

    const handleFileChange = (e) => {
        setSelectedFiles([...e.target.files]); 
    };


    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        if (selectedFiles.length === 0) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'No file selected' });
            return;
        }
    
        const uploadPromises = selectedFiles.map(async (file) => {
            const fileAsBytes = await fileToBytes(file);
            const fileAsBase64 = arrayBufferToBase64(fileAsBytes);
    
            const fileExtension = file.name.split('.').pop();
    
            const payload = [{
                memberId,
                originalname: file.name,
                mimetype: fileExtension,
                size: file.size,
                buffer: fileAsBase64,
            }]
            
            return createMemberAttachment(payload, memberId); 
        });
    
        try {
            const responses = await Promise.all(uploadPromises);
            const successResponses = responses.filter(response => response.status === 'success');
    
            if (successResponses.length === responses.length) {
                setUploadDialog(false);
                toast.current.show({ severity: 'success', summary: 'Success', detail: `${successResponses.length} files uploaded successfully` });
                setSelectedFiles([]); 
            } else {
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Some files failed to upload' });
            }
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to upload file(s)' });
            console.error("Operation failed", { code: typeof error?.code === "string" && /^[A-Z][A-Z0-9_]{1,24}$/.test(error.code) ? error.code : "UNAVAILABLE" });
        }
    };
    
    const fileToBytes = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                resolve(reader.result);
            };
            reader.onerror = (error) => reject(error);
            reader.readAsArrayBuffer(file);
        });
    };

    const arrayBufferToBase64 = (buffer) => {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0, len = bytes.byteLength; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    };

    return (
        <>
            <Button permission="attachments.manage" label="الحاق مرفق خارجي" icon="pi pi-upload" onClick={() => setUploadDialog(true)} />
            <Dialog header="الحاق مرفق خارجي"  visible={uploadDialog} style={{ width: '50vw' }} onHide={() => setUploadDialog(false)}>
                <form onSubmit={handleUploadSubmit}>
                    <input type="file" name="file" multiple onChange={handleFileChange} required />
                    <Button permission="attachments.manage" type="submit" label="ارسال" icon="pi pi-check" />
                </form>
            </Dialog>
            <Toast ref={toast} />
        </>
    );
};

export default MemberAttachment;
