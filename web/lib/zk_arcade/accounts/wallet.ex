defmodule ZkArcade.Accounts.Wallet do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "wallets" do
    field :address, :string
    field :points, :integer, default: 0
    field :balance, :float, default: 0.0
    # TODO: Add the required fields to use in wallets
  end

  @doc false
  def changeset(wallet, attrs) do
    wallet
    |> cast(attrs, [:address, :points, :balance])
    |> validate_address()
    |> validate_required([:address])
    |> put_default(:points, 0)
    |> put_default(:balance, 0.0)
    |> unique_constraint(:address, name: :wallets_address_index)
  end

  defp put_default(changeset, field, default) do
    case get_field(changeset, field) do
      nil -> put_change(changeset, field, default)
      _ -> changeset
    end
  end

  defp validate_address(changeset) do
    ethereum_address_regex = ~r/^(0x)?[0-9a-fA-F]{40}$/
    max_length = 42

    changeset
    |> validate_format(:address, ethereum_address_regex, message: "must be an ethereum valid address")
    |> validate_length(:address, max: max_length)
  end
end
