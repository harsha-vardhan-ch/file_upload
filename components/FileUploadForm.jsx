import { useState } from "react";
import AWS from "aws-sdk";

const FileUploadForm = () => {

	const [selectedFile, setSelectedFile] = useState(null);
	const [emailAddresses, setEmailAddresses] = useState("");

	// console.log(emailAddresses);
	const handleFileChange = (event) => {
		setSelectedFile(event.target.files?.[0] || null);
	};

	const handleEmailChange = (event) => {
		setEmailAddresses(event.target.value);
	};

	const handleUpload = () => {
		if (!selectedFile) {
			alert("Please select a file to upload.");
			return;
		}

		if (!emailAddresses) {
			alert("Please enter at least one email address.");
			return;
		}

		const emails = emailAddresses.split(",");

		// Read the file content using FileReader API
		const reader = new FileReader();

		reader.onload = async(event) => {
      var uploadedUrl
			const fileContent = event.target.result;

			// Upload file to S3
			const s3 = new AWS.S3({
				accessKeyId: "AKIAVGOB6SXRK3PEH24N",
				secretAccessKey: "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",
				region: "us-east-1",
			});

      // Upload data to DynamoDB
      const dynamodb = new AWS.DynamoDB.DocumentClient({
          accessKeyId: "AKIAVGOB6SXRK3PEH24N",
          secretAccessKey: "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",
          region: "us-east-1",
      });

			const params = {
				Bucket: "harsha001",
				Key: "upload",
				Body: fileContent,
			};

			// Upload the file to S3
			await s3.upload(params, (err, data) => {
				if (err) {
					console.error("Error uploading file:", err);
				} else {
					uploadedUrl = data.Location;
					console.log("File uploaded successfully:", uploadedUrl);
          
					sendEmails(uploadedUrl, emails);
				}
				// sendEmails(data.Location, emails);
			});

      //Upload metadata to dynamoDB
      const dynamoDBParams = {
        TableName: "vamhe_table",
        Item: {
          id: selectedFile.name, // Use a unique identifier for the DynamoDB item
          filename: selectedFile.name,
          size: selectedFile.size,
          timestamp: new Date().toISOString(),
          s3ObjectUrl: uploadedUrl,
        },
      };

      await dynamodb.put(dynamoDBParams).promise();
			console.log("File info stored in DynamoDB.");

      
      console.log("Emails sent successfully.");

		};

		// Start reading the selected file as a data URL
		reader.readAsDataURL(selectedFile);
	};

	const sendEmail = (to, subject, message) => {
		const ses = new AWS.SES({
			accessKeyId: "AKIAVGOB6SXRK3PEH24N",
			secretAccessKey: "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",
			region: "us-east-1",
		});
		const params = {
			Destination: {
				ToAddresses: [to],
			},
			Message: {
				Body: {
					Text: {
						Data: message,
					},
				},
				Subject: {
					Data: subject,
				},
			},
			Source: "sthonuku@uab.edu"
		};

		return ses.sendEmail(params).promise();
	};

	const sendEmails = (uploadedUrl, emails) => {
		const subject = "URL to the File";
		const message = uploadedUrl;
		console.log(emails);
		Promise.all(emails.map((email) => sendEmail(email, subject, message)))
			.then(() => {
				console.log("Emails sent successfully");
			})
			.catch((err) => {
				console.error("Error sending emails:", err);
			});
	};

	return (
		<div>
			<h1>File Upload to AWS S3</h1>
			<input type="file" onChange={handleFileChange} />
			<br />
			<label htmlFor="emailInput">
				Email Addresses (up to 5, comma-separated):
			</label>
			<input
				type="text"
				id="emailInput"
				value={emailAddresses}
				onChange={handleEmailChange}
			/>
			<br />
			<button onClick={handleUpload}>Upload</button>
		</div>
	);
};

export default FileUploadForm;