defmodule ZkArcade.Repo.Migrations.AddPointsAndBalanceToWallets do
  use Ecto.Migration

  def change do
    alter table(:wallets) do
      add :points, :integer, default: 0, null: false
      add :balance, :float, default: 0.0, null: false
    end
  end
end
