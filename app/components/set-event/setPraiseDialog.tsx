import Praise from "../worship-order/Praise";

export default function SetPraiseDialog({ id }: { id: number }) {
  return (
    <div>
      <div>
        <Praise id={id} />
      </div>
    </div>
  );
}
