const API_ENDPOINT =
  "https://towy5zwv40.execute-api.us-east-1.amazonaws.com/prod";
const DEBUG = false;

const listPhotos = async () => {
  const response = await fetch(`${API_ENDPOINT}/photo`, {
    method: "GET",
  });
  return await response.json();
};

const deletePhoto = async (element) => {
  const file = document.querySelector("#file-delete").files[0];
  fetch(`${API_ENDPOINT}/photo`, {
    method: "DELETE",
    body: JSON.stringify({
      id: element["data-id"],
      key: element["data-key"],
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.info("successfully deleted file");
      DEBUG && console.log(data);
      alert("success");
    })
    .catch((error) => {
      console.error("error deleting file");
      DEBUG && console.error(error);
    });
};

const renderPhotos = async () => {
  const photoList = document.createElement("div");
  photoList.setAttribute("id", "photo-list");
  const photos = await listPhotos();
  photos.map((i) => {
    const photoImage = document.createElement("img");
    photoImage.setAttribute("src", i.key);
    photoImage.setAttribute("alt", i.key);
    photoImage.setAttribute("id", `photo-${i.id}`);

    const photoControls = document.createElement("button");
    photoControls.textContent = "Delete";
    photoControls.setAttribute("data-key", i.key);
    photoControls.setAttribute("data-id", i.id);
    photoControls.addEventListener("click", deletePhoto);

    const photoWrap = document.createElement("figure");
    photoWrap.appendChild(photoImage);
    photoWrap.appendChild(photoControls);
    photoList.appendChild(photoWrap);
  });
  document.querySelector("div#app").appendChild(photoList);
};

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

const uploadPhoto = async () => {
  const formData = new FormData();
  const file = document.querySelector("#file-upload").files[0];

  DEBUG && console.log(file);

  const fileAsBase64 = await toBase64(file);
  formData.append("file", file.value);

  fetch(`${API_ENDPOINT}/photo`, {
    method: "POST",
    body: JSON.stringify({
      fileAsBase64: fileAsBase64,
      name: file.name,
      type: file.type,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.info("successfully uploading file");
      DEBUG && console.log(data);
      alert("success");
    })
    .catch((error) => {
      console.error("error uploading file");
      DEBUG && console.error(error);
    });
};

const uploadPhotoUi = () => {
  const fileUploadInput = document.createElement("input");
  fileUploadInput.setAttribute("id", "file-upload");
  fileUploadInput.setAttribute("type", "file");
  fileUploadInput.setAttribute("accept", ".png,.jpg,.jpeg");

  const uploadButton = document.createElement("button");
  uploadButton.setAttribute("id", "upload");
  uploadButton.setAttribute("type", "button");
  uploadButton.innerHTML = "Upload";
  uploadButton.addEventListener("click", uploadPhoto);

  const uploadForm = document.createElement("form");
  uploadForm.setAttribute("id", "upload-form");
  uploadForm.appendChild(fileUploadInput);
  uploadForm.appendChild(uploadButton);
  document.querySelector("div#app").appendChild(uploadForm);
};

(function () {
  console.log("loading app ...");

  uploadPhotoUi();
  renderPhotos();

  console.log("app loading complete");
})();
