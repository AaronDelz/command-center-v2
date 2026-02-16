import { redirect } from 'next/navigation';

export default function GoalsRedirect(): never {
  redirect('/helm');
}
