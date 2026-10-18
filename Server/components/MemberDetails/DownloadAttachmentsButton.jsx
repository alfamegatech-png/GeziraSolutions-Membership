import React, { useState, useEffect, useRef } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog'; 
import { Toast } from 'primereact/toast';
import { getMemberAttachments } from '@components/Members/member';

const MemberDownloadAttachments = ({ memberId }) => {
    const [attachments, setAttachments] = useState([]);
    const [dialogVisible, setDialogVisible] = useState(false); 
    const toast = useRef(null);

    useEffect(() => {
        const fetchAttachments = async () => {
            const response = await getMemberAttachments(memberId);
            if (response.status === 'success') {
                setAttachments(response.data);
            } else {
                toast.current.show({ severity: 'error', summary: 'Error', detail: response.message });
            }
        };

        fetchAttachments();
    }, [memberId]);
    
    const downloadAttachment = (attachment) => {
        const mimeType = attachment.file_extension || 'application/octet-stream';
        const base64Data = uint8ArrayToBase64(attachment.attachment_byte.data);
        const downloadLink = document.createElement('a');
        downloadLink.href = `data:${mimeType};base64,${base64Data}`;
        downloadLink.download = attachment.file_name;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        setDialogVisible(false); 
    };

    const uint8ArrayToBase64 = (buffer) => {
        var binary = '';
        var bytes = new Uint8Array(buffer);
        var len = bytes.byteLength;
        for (var i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    };
    const attachmentList = attachments.length > 0 ? (
        <>
            {attachments.map((attachment, index) => (
                <div key={index} style={{ padding: '10px 0' }}>
                    <Button label={attachment.file_name} icon="pi pi-download"
                        onClick={() => downloadAttachment(attachment)}
                        className="p-button-outlined" />
                </div>
            ))}
        </>
    ) : (
        <div>No attachments found for the specified member.</div>
    );


    return (
        <>
            <Button label="عرض الملفات" icon="pi pi-external-link" onClick={() => setDialogVisible(true)} />
            <Dialog header="تحميل الملفات " visible={dialogVisible} style={{ width: '50vw' }} onHide={() => setDialogVisible(false)} modal>
                {attachmentList}
            </Dialog>
            <Toast ref={toast} />
        </>
    );
};

export default MemberDownloadAttachments;