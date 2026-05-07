export function UserProfilePage() {
  return (
    <div className="mx-auto w-full max-w-[900px]">
      <h1 className="text-[30px] font-bold text-brand">My Profile</h1>
      <p className="mt-2 text-sm text-brand/70">
        Personal information and account settings for the referred user portal.
      </p>
      <div className="mt-5 rounded-2xl border border-line bg-white p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs text-brand/60">Full Name</p>
            <p className="mt-1 font-semibold text-brand">Ahmad Stan</p>
          </div>
          <div>
            <p className="text-xs text-brand/60">Email</p>
            <p className="mt-1 font-semibold text-brand">ahmad.stan@mail.com</p>
          </div>
          <div>
            <p className="text-xs text-brand/60">Phone</p>
            <p className="mt-1 font-semibold text-brand">+92 301 0000000</p>
          </div>
          <div>
            <p className="text-xs text-brand/60">Member Since</p>
            <p className="mt-1 font-semibold text-brand">2020</p>
          </div>
        </div>
      </div>
    </div>
  )
}
