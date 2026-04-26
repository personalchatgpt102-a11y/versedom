const formatTokenValue = (value) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return "0";
  }

  return new Intl.NumberFormat().format(parsed);
};

function UserTokenFields({ profile = {}, className = "" }) {
  return (
    <div className={`grid grid-cols-2 gap-2 ${className}`.trim()}>
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          Coins
        </p>
        <p className="mt-1 text-sm font-black text-zinc-900">
          {formatTokenValue(profile.coins)}
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          Beta Coins
        </p>
        <p className="mt-1 text-sm font-black text-zinc-900">
          {formatTokenValue(profile.betaCoins)}
        </p>
      </div>
    </div>
  );
}

export default UserTokenFields;
