# Use the official SDK image to build the app
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

# Copy the csproj file and restore dependencies
COPY ["FormCraftAPI.csproj", "./"]
RUN dotnet restore "FormCraftAPI.csproj"

# Copy the rest of the application files and build
COPY . .
RUN dotnet build "FormCraftAPI.csproj" -c Release -o /app/build

# Publish the application
FROM build AS publish
RUN dotnet publish "FormCraftAPI.csproj" -c Release -o /app/publish

# Use the lighter asp.net runtime image for the final stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final

WORKDIR /app

# Copy the published app from the publish stage
COPY --from=publish /app/publish .

# Expose ports
EXPOSE 8080
EXPOSE 80

# Configure environment variables
ENV ASPNETCORE_URLS=http://+:80

# Start the API
ENTRYPOINT ["dotnet", "FormCraftAPI.dll"]
