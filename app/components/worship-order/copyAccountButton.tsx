import { Button } from "../ui/button";

export default function CopyAccountButton() {
  const accountNumber = "국민은행 104011075169"; // 복사할 계좌번호

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(accountNumber);
      alert("복사완료!");
    } catch (error) {
      console.error("복사 실패:", error);
    }
  };

  return (
    <div className="flex flex-col items-center pb-8">
      <p>재)한국대학생선교회</p>
      <p className="pb-4">국민은행 104011075169</p>
      <Button
        onClick={copyToClipboard}
        className="px-4 py-2 text-white font-medium rounded-lg shadow-md active:scale-95 transition duration-200"
      >
        복사하기
      </Button>
    </div>
  );
}
