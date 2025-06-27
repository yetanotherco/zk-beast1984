defmodule ZkArcadeWeb.PageController do
  # require Logger
  use ZkArcadeWeb, :controller

  def home(conn, _params) do
    conn = conn |> assign(:show_wallet_form, true)
    render(conn, :home, layout: false)
  end

end
