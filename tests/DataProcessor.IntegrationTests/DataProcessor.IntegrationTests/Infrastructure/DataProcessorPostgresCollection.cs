namespace DataProcessor.IntegrationTests.Infrastructure;

[CollectionDefinition(Name, DisableParallelization = true)]
public class DataProcessorPostgresCollection : ICollectionFixture<PostgresFixture>
{
    public const string Name = "DataProcessor PostgreSQL";
}
