defmodule ZkArcadeWeb.ProofController do
  require Logger
  use ZkArcadeWeb, :controller

  def home(conn, _params) do
    render(conn, :home, layout: false)
  end
end
