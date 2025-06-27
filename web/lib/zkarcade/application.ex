defmodule ZkArcade.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      ZkArcadeWeb.Telemetry,
      {Cachex, name: :eth_price_cache},
      {DNSCluster, query: Application.get_env(:zkarcade, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: ZkArcade.PubSub},
      # Start the Ecto db repository
      ZkArcade.Repo,
      # Start the Finch HTTP client for getting data from batch_data_pointer
      {Finch, name: ZkArcade.Finch},
      # Start a worker by calling: ZkArcade.Worker.start_link(arg)
      # {ZkArcade.Worker, arg},
      # Start to serve requests, typically the last entry
      ZkArcadeWeb.Endpoint
    ]

    # Start the main supervisor
    opts = [strategy: :one_for_one, name: ZkArcade.Supervisor]
    Supervisor.start_link(children, opts)

    # Start the periodic task, with its own supervisor and mutex
    periodic_children = [
      {ZkArcade.Periodically, []},
      Supervisor.child_spec({Mutex, [name: BatchMutex, meta: "Used to prevent concurrent downloads"]}, id: :batch_mutex),
      Supervisor.child_spec({Mutex, [name: OperatorMutex, meta: "Used to prevent concurrent operator processing"]}, id: :operator_mutex)
    ]

    periodic_opts = [strategy: :one_for_all, name: ZkArcade.Periodically.Supervisor]
    Supervisor.start_link(periodic_children, periodic_opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    ZkArcadeWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
