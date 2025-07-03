defmodule ZkArcadeWeb.Router do
  use ZkArcadeWeb, :router

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_live_flash
    plug :put_root_layout, html: {ZkArcadeWeb.Layouts, :root}
    plug :protect_from_forgery
    plug :put_secure_browser_headers
  end

  scope "/", ZkArcadeWeb do
    pipe_through :browser

    get "/", PageController, :home
  end

  scope "/", ZkArcadeWeb do
    pipe_through [:browser]

    get "/terms-conditions", PageController, :terms

    get "/sign", SignController, :home
    post "/sign", SignController, :connect_wallet

    get "/disconnect", PageController, :disconnect_wallet

    get "/submit-proof", ProofController, :home
  end

  # Other scopes may use custom stacks.
  # scope "/api", ZkArcadeWeb do
  #   pipe_through :api
  # end

  # Enable LiveDashboard in development
  if Application.compile_env(:zk_arcade, :dev_routes) do
    # If you want to use the LiveDashboard in production, you should put
    # it behind authentication and allow only admins to access it.
    # If your application does not have an admins-only section yet,
    # you can use Plug.BasicAuth to set up some basic authentication
    # as long as you are also using SSL (which you should anyway).
    import Phoenix.LiveDashboard.Router

    scope "/dev" do
      pipe_through :browser

      live_dashboard "/dashboard", metrics: ZkArcadeWeb.Telemetry
    end
  end
end
