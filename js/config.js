// An empty media path keeps the item available for local testing without a failed network request.
window.MUSEUM = {
  canva: "", // Link Canva ở chế độ xem hoặc trình chiếu.
  team: "Nhóm thực hiện: đang cập nhật",
  audio: { music: "", ambience: "", interaction: "", transition: "" },
  scenes: [
    { id: "thien-quang", title: "Giếng Thiên Quang", panorama: "", yaw: 0, points: [
      {pitch: 0, yaw: -36, scene: "nha-bia-tay"},
      {pitch: 0, yaw: 36, scene: "nha-bia-dong"}
    ] },
    { id: "nha-bia-tay", title: "Dãy nhà bia phía tây", panorama: "", yaw: 0, points: [
      {pitch: -3, yaw: 5, object: "nham-tuat-1442"},
      {pitch: 0, yaw: 90, scene: "thien-quang"}
    ] },
    { id: "nha-bia-dong", title: "Dãy nhà bia phía đông", panorama: "", yaw: 0, points: [
      {pitch: 0, yaw: -90, scene: "thien-quang"}
    ] }
  ],
  objects: [
    { id: "nham-tuat-1442", title: "Bia khoa Nhâm Tuất 1442", model: "", audio: "",
      info: "Bia được dựng năm 1484 để ghi danh 33 người đỗ khoa Nhâm Tuất năm 1442. Nguyễn Trực là người đỗ đầu.",
      hotspots: [] },
    { id: "giap-thin-1604", title: "Bia khoa Giáp Thìn 1604", model: "", audio: "",
      info: "Hồ sơ Ký ức Thế giới của UNESCO sử dụng hình ảnh thiết kế bia khoa thi năm 1604 để giới thiệu bộ bia.",
      hotspots: [] }
  ]
};
