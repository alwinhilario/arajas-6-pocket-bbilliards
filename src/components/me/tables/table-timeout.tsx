import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import { TTableOpts, TTableOptsData } from "./types";

interface IProps {
  data: TTableOptsData;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onConfirm: () => void;
}

export default function TableTimeout({ data, setIsOpen, onConfirm }: IProps) {
  return (
    <div
      className='fixed bg-black/90 top-0 left-0 h-screen w-screen flex justify-center items-center cursor-pointer z-50'
      onClick={() => {
        setIsOpen((prevState) => !prevState);
      }}
    >
      <Card
        className='w-[400px] p-5 cursor-default'
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className='text-base pb-5'>
          {!data?.out ? (
            <>
              Are you sure you want to <strong>Calculate</strong> and end the <strong>Open Time</strong>?
            </>
          ) : (
            <>
              Are you sure you want to <strong>Time out Table #{data?.value?.split("_")?.[1]}</strong>?
            </>
          )}
        </div>

        <div className='flex gap-2'>
          <Button size='lg' className={"cursor-pointer flex-1"} onClick={onConfirm}>
            Confirm
          </Button>
          <Button
            size='lg'
            className={"cursor-pointer flex-1"}
            variant={"outline"}
            onClick={() => {
              setIsOpen((prevState) => !prevState);
            }}
          >
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  );
}
