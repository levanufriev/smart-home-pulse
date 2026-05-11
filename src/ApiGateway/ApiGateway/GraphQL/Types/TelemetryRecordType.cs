using HotChocolate.Types;
using Shared.Domain.Entities;

namespace ApiGateway.GraphQL.Types;

public class TelemetryRecordType : ObjectType<TelemetryRecord>
{
    protected override void Configure(IObjectTypeDescriptor<TelemetryRecord> descriptor)
    {
        descriptor.Field(t => t.BatchEventId).Ignore();
    }
}