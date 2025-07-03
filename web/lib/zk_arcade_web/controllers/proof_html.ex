defmodule ZkArcadeWeb.ProofHTML do
  @moduledoc """
  This module contains pages rendered by ProofController.

  See the `proof_html` directory for all templates available.
  """
  use ZkArcadeWeb, :html

  embed_templates "proof_html/*"
end
